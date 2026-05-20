/**
 * HDKey (Hierarchical Deterministic Key) - BIP32 implementation
 * Uses @noble/secp256k1 and @scure/base for pure JS implementation
 */

import { hmac } from '@noble/hashes/hmac.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, concatBytes } from '@noble/hashes/utils.js';
import { createHash } from 'node:crypto';
import * as secp256k1 from '@noble/secp256k1';
import { base58check as base58checkFactory } from '@scure/base';

const base58check = base58checkFactory(sha256);

// secp256k1 curve order (n)
const CURVE_ORDER = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141n;

// Compat layer for @noble/secp256k1 v2 vs v3
const secpUtils = secp256k1.utils as Record<string, unknown>;
const isValidSecretKey = typeof secpUtils.isValidSecretKey === 'function'
  ? (k: Uint8Array) => (secp256k1.utils.isValidSecretKey as (k: Uint8Array) => boolean)(k)
  : (k: Uint8Array) => (secpUtils.isValidPrivateKey as (k: Uint8Array) => boolean)(k);
const randomSecretKey = typeof secpUtils.randomSecretKey === 'function'
  ? (seed?: Uint8Array) => (secp256k1.utils.randomSecretKey as (seed?: Uint8Array) => Uint8Array)(seed)
  : (seed?: Uint8Array) => (secpUtils.randomPrivateKey as (seed?: Uint8Array) => Uint8Array)(seed);

const MASTER_SECRET = new TextEncoder().encode('Bitcoin seed');
export const HARDENED_OFFSET = 0x80000000;
const LEN = 78;

// Bitcoin hardcoded by default
const BITCOIN_VERSIONS = { private: 0x0488ade4, public: 0x0488b21e };

export interface Versions {
  private: number;
  public: number;
}

export interface HDKeyJSON {
  xpriv: string | null;
  xpub: string;
}

function hash160(buf: Uint8Array): Uint8Array {
  const sha = sha256(buf);
  return createHash('ripemd160').update(Buffer.from(sha)).digest();
}

export class HDKey {
  versions: Versions;
  depth: number = 0;
  index: number = 0;
  parentFingerprint: number = 0;
  chainCode: Uint8Array | null = null;

  private _privateKey: Uint8Array | null = null;
  private _publicKey: Uint8Array | null = null;
  private _identifier: Uint8Array | null = null;
  private _fingerprint: number = 0;

  private setPublicKey(publicKey: Uint8Array): void {
    this._publicKey = publicKey;
    this._identifier = hash160(this._publicKey);
    this._fingerprint = new DataView(this._identifier.slice(0, 4).buffer).getUint32(0);
    this._privateKey = null;
  }

  private serialize(version: number, key: Uint8Array): Uint8Array {
    const buffer = new Uint8Array(LEN);
    const view = new DataView(buffer.buffer);

    view.setUint32(0, version);
    view.setUint8(4, this.depth);

    const fingerprint = this.depth ? this.parentFingerprint : 0x00000000;
    view.setUint32(5, fingerprint);
    view.setUint32(9, this.index);

    buffer.set(this.chainCode!, 13);
    buffer.set(key, 45);

    return buffer;
  }

  constructor(versions?: Versions) {
    this.versions = versions || BITCOIN_VERSIONS;
  }

  get fingerprint(): number {
    return this._fingerprint;
  }

  get identifier(): Uint8Array | null {
    return this._identifier;
  }

  get pubKeyHash(): Uint8Array | null {
    return this.identifier;
  }

  get privateKey(): Uint8Array | null {
    return this._privateKey;
  }

  set privateKey(value: Uint8Array) {
    if (value.length !== 32) {
      throw new Error('Private key must be 32 bytes.');
    }
    if (!isValidSecretKey(value)) {
      throw new Error('Invalid private key');
    }

    this._privateKey = value;
    this._publicKey = secp256k1.getPublicKey(value, true);
    this._identifier = hash160(this._publicKey);
    this._fingerprint = new DataView(this._identifier.slice(0, 4).buffer).getUint32(0);
  }

  get publicKey(): Uint8Array | null {
    return this._publicKey;
  }

  set publicKey(value: Uint8Array) {
    if (value.length !== 33 && value.length !== 65) {
      throw new Error('Public key must be 33 or 65 bytes.');
    }

    const publicKey = value.length === 65 ? secp256k1.Point.fromHex(bytesToHex(value)).toBytes(true) : value;
    
    if (!secp256k1.utils.isValidPublicKey(publicKey)) {
      throw new Error('Invalid public key');
    }

    this.setPublicKey(publicKey);
  }

  get privateExtendedKey(): string | null {
    if (this._privateKey) {
      return base58check.encode(
        this.serialize(
          this.versions.private,
          concatBytes(new Uint8Array([0]), this._privateKey)
        )
      );
    }
    return null;
  }

  get publicExtendedKey(): string {
    return base58check.encode(
      this.serialize(this.versions.public, this.publicKey!)
    );
  }

  derive(path: string): HDKey {
    if (path === 'm' || path === 'M' || path === "m'" || path === "M'") {
      return this;
    }

    const entries = path.split('/');
    let hdkey: HDKey = this;

    entries.forEach((c, i) => {
      if (i === 0) {
        if (!/^[mM]{1}/.test(c)) {
          throw new Error('Path must start with "m" or "M"');
        }
        return;
      }

      const hardened = c.length > 1 && c[c.length - 1] === "'";
      let childIndex = parseInt(c, 10);

      if (childIndex >= HARDENED_OFFSET) {
        throw new Error('Invalid index');
      }

      if (hardened) {
        childIndex += HARDENED_OFFSET;
      }

      hdkey = hdkey.deriveChild(childIndex);
    });

    return hdkey;
  }

  deriveChild(index: number): HDKey {
    const isHardened = index >= HARDENED_OFFSET;
    const indexBuffer = new Uint8Array(4);
    new DataView(indexBuffer.buffer).setUint32(0, index);

    let data: Uint8Array;

    if (isHardened) {
      // Hardened child
      if (!this.privateKey) {
        throw new Error('Could not derive hardened child key');
      }

      const zb = new Uint8Array([0]);
      const privateKeyData = concatBytes(zb, this.privateKey);

      // data = 0x00 || ser256(kpar) || ser32(index)
      data = concatBytes(privateKeyData, indexBuffer);
    } else {
      // Normal child
      // data = serP(point(kpar)) || ser32(index)
      data = concatBytes(this.publicKey!, indexBuffer);
    }

    const I = hmac(sha512, this.chainCode!, data);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);

    const hdkey = new HDKey(this.versions);

    // Private parent key -> private child key
    if (this.privateKey) {
      // ki = parse256(IL) + kpar (mod n)
      try {
        const keyInt = BigInt('0x' + bytesToHex(this.privateKey));
        const tweakInt = BigInt('0x' + bytesToHex(IL));
        const sum = (keyInt + tweakInt) % CURVE_ORDER;
        if (sum === 0n) throw new Error('invalid key material');
        hdkey.privateKey = hexToBytes(sum.toString(16).padStart(64, '0'));
      } catch {
        throw new Error('Failed to derive child key: invalid key material');
      }
    } else {
      // Public parent key -> public child key
      // Ki = point(parse256(IL)) + Kpar
      try {
        const tweakInt = BigInt('0x' + bytesToHex(IL));
        hdkey.publicKey = secp256k1.Point.BASE.multiply(tweakInt).add(secp256k1.Point.fromHex(bytesToHex(this.publicKey!))).toBytes(true);
      } catch {
        throw new Error('Failed to derive child key: invalid key material');
      }
    }

    hdkey.chainCode = IR;
    hdkey.depth = this.depth + 1;
    hdkey.parentFingerprint = this.fingerprint;
    hdkey.index = index;

    return hdkey;
  }

  sign(hash: Uint8Array): Uint8Array {
    if (!this.privateKey) {
      throw new Error('Cannot sign without private key');
    }
    const signature = secp256k1.sign(hash, this.privateKey);
    return (signature as unknown as { toCompactRawBytes(): Uint8Array }).toCompactRawBytes();
  }

  verify(hash: Uint8Array, signature: Uint8Array): boolean {
    try {
      return secp256k1.verify(signature, hash, this.publicKey!);
    } catch {
      return false;
    }
  }

  wipePrivateData(): HDKey {
    if (this._privateKey) {
      this._privateKey = randomSecretKey();
    }
    this._privateKey = null;
    return this;
  }

  toJSON(): HDKeyJSON {
    return {
      xpriv: this.privateExtendedKey,
      xpub: this.publicExtendedKey,
    };
  }

  static fromMasterSeed(seedBuffer: Uint8Array | Buffer, versions?: Versions): HDKey {
    const seed = seedBuffer instanceof Buffer ? new Uint8Array(seedBuffer) : seedBuffer;
    const I = hmac(sha512, MASTER_SECRET, seed);
    const IL = I.slice(0, 32);
    const IR = I.slice(32);

    const hdkey = new HDKey(versions);
    hdkey.chainCode = IR;
    hdkey.privateKey = IL;

    return hdkey;
  }

  static fromExtendedKey(
    base58key: string,
    versions?: Versions,
    _skipVerification?: boolean
  ): HDKey {
    versions = versions || BITCOIN_VERSIONS;
    const hdkey = new HDKey(versions);
    const keyBuffer = base58check.decode(base58key);

    const version = new DataView(keyBuffer.buffer).getUint32(0);
    if (version !== versions.private && version !== versions.public) {
      throw new Error('Version mismatch: does not match private or public');
    }

    hdkey.depth = keyBuffer[4];
    hdkey.parentFingerprint = new DataView(keyBuffer.buffer).getUint32(5);
    hdkey.index = new DataView(keyBuffer.buffer).getUint32(9);
    hdkey.chainCode = keyBuffer.slice(13, 45);

    const key = keyBuffer.slice(45);
    if (key[0] === 0) {
      // private
      if (version !== versions.private) {
        throw new Error('Version mismatch: version does not match private');
      }
      hdkey.privateKey = key.slice(1); // cut off first 0x0 byte
    } else {
      // public
      if (version !== versions.public) {
        throw new Error('Version mismatch: version does not match public');
      }
      // Always use the public setter for consistency
      hdkey.publicKey = key;
    }

    return hdkey;
  }

  static fromJSON(obj: HDKeyJSON, versions?: Versions): HDKey {
    return HDKey.fromExtendedKey(obj.xpriv || obj.xpub, versions);
  }
}

export default HDKey;
