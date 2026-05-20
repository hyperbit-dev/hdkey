Object.defineProperties(exports, {
	__esModule: { value: true },
	[Symbol.toStringTag]: { value: "Module" }
});
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let _noble_hashes_hmac_js = require("@noble/hashes/hmac.js");
let _noble_hashes_sha2_js = require("@noble/hashes/sha2.js");
let _noble_hashes_utils_js = require("@noble/hashes/utils.js");
let node_crypto = require("node:crypto");
let _noble_secp256k1 = require("@noble/secp256k1");
_noble_secp256k1 = __toESM(_noble_secp256k1, 1);
//#region src/index.ts
/**
* HDKey (Hierarchical Deterministic Key) - BIP32 implementation
* Uses @noble/secp256k1 and @scure/base for pure JS implementation
*/
var base58check = (0, require("@scure/base").base58check)(_noble_hashes_sha2_js.sha256);
var CURVE_ORDER = 115792089237316195423570985008687907852837564279074904382605163141518161494337n;
var secpUtils = _noble_secp256k1.utils;
var isValidSecretKey = typeof secpUtils.isValidSecretKey === "function" ? (k) => _noble_secp256k1.utils.isValidSecretKey(k) : (k) => secpUtils.isValidPrivateKey(k);
var randomSecretKey = typeof secpUtils.randomSecretKey === "function" ? (seed) => _noble_secp256k1.utils.randomSecretKey(seed) : (seed) => secpUtils.randomPrivateKey(seed);
var MASTER_SECRET = new TextEncoder().encode("Bitcoin seed");
var HARDENED_OFFSET = 2147483648;
var LEN = 78;
var BITCOIN_VERSIONS = {
	private: 76066276,
	public: 76067358
};
function hash160(buf) {
	const sha = (0, _noble_hashes_sha2_js.sha256)(buf);
	return (0, node_crypto.createHash)("ripemd160").update(Buffer.from(sha)).digest();
}
var HDKey = class HDKey {
	setPublicKey(publicKey) {
		this._publicKey = publicKey;
		this._identifier = hash160(this._publicKey);
		this._fingerprint = new DataView(this._identifier.slice(0, 4).buffer).getUint32(0);
		this._privateKey = null;
	}
	serialize(version, key) {
		const buffer = new Uint8Array(LEN);
		const view = new DataView(buffer.buffer);
		view.setUint32(0, version);
		view.setUint8(4, this.depth);
		const fingerprint = this.depth ? this.parentFingerprint : 0;
		view.setUint32(5, fingerprint);
		view.setUint32(9, this.index);
		buffer.set(this.chainCode, 13);
		buffer.set(key, 45);
		return buffer;
	}
	constructor(versions) {
		this.depth = 0;
		this.index = 0;
		this.parentFingerprint = 0;
		this.chainCode = null;
		this._privateKey = null;
		this._publicKey = null;
		this._identifier = null;
		this._fingerprint = 0;
		this.versions = versions || BITCOIN_VERSIONS;
	}
	get fingerprint() {
		return this._fingerprint;
	}
	get identifier() {
		return this._identifier;
	}
	get pubKeyHash() {
		return this.identifier;
	}
	get privateKey() {
		return this._privateKey;
	}
	set privateKey(value) {
		if (value.length !== 32) throw new Error("Private key must be 32 bytes.");
		if (!isValidSecretKey(value)) throw new Error("Invalid private key");
		this._privateKey = value;
		this._publicKey = _noble_secp256k1.getPublicKey(value, true);
		this._identifier = hash160(this._publicKey);
		this._fingerprint = new DataView(this._identifier.slice(0, 4).buffer).getUint32(0);
	}
	get publicKey() {
		return this._publicKey;
	}
	set publicKey(value) {
		if (value.length !== 33 && value.length !== 65) throw new Error("Public key must be 33 or 65 bytes.");
		const publicKey = value.length === 65 ? _noble_secp256k1.Point.fromHex((0, _noble_hashes_utils_js.bytesToHex)(value)).toBytes(true) : value;
		if (!_noble_secp256k1.utils.isValidPublicKey(publicKey)) throw new Error("Invalid public key");
		this.setPublicKey(publicKey);
	}
	get privateExtendedKey() {
		if (this._privateKey) return base58check.encode(this.serialize(this.versions.private, (0, _noble_hashes_utils_js.concatBytes)(new Uint8Array([0]), this._privateKey)));
		return null;
	}
	get publicExtendedKey() {
		return base58check.encode(this.serialize(this.versions.public, this.publicKey));
	}
	derive(path) {
		if (path === "m" || path === "M" || path === "m'" || path === "M'") return this;
		const entries = path.split("/");
		let hdkey = this;
		entries.forEach((c, i) => {
			if (i === 0) {
				if (!/^[mM]{1}/.test(c)) throw new Error("Path must start with \"m\" or \"M\"");
				return;
			}
			const hardened = c.length > 1 && c[c.length - 1] === "'";
			let childIndex = parseInt(c, 10);
			if (childIndex >= 2147483648) throw new Error("Invalid index");
			if (hardened) childIndex += HARDENED_OFFSET;
			hdkey = hdkey.deriveChild(childIndex);
		});
		return hdkey;
	}
	deriveChild(index) {
		const isHardened = index >= HARDENED_OFFSET;
		const indexBuffer = new Uint8Array(4);
		new DataView(indexBuffer.buffer).setUint32(0, index);
		let data;
		if (isHardened) {
			if (!this.privateKey) throw new Error("Could not derive hardened child key");
			data = (0, _noble_hashes_utils_js.concatBytes)((0, _noble_hashes_utils_js.concatBytes)(new Uint8Array([0]), this.privateKey), indexBuffer);
		} else data = (0, _noble_hashes_utils_js.concatBytes)(this.publicKey, indexBuffer);
		const I = (0, _noble_hashes_hmac_js.hmac)(_noble_hashes_sha2_js.sha512, this.chainCode, data);
		const IL = I.slice(0, 32);
		const IR = I.slice(32);
		const hdkey = new HDKey(this.versions);
		if (this.privateKey) try {
			const sum = (BigInt("0x" + (0, _noble_hashes_utils_js.bytesToHex)(this.privateKey)) + BigInt("0x" + (0, _noble_hashes_utils_js.bytesToHex)(IL))) % CURVE_ORDER;
			if (sum === 0n) throw new Error("invalid key material");
			hdkey.privateKey = (0, _noble_hashes_utils_js.hexToBytes)(sum.toString(16).padStart(64, "0"));
		} catch {
			throw new Error("Failed to derive child key: invalid key material");
		}
		else try {
			const tweakInt = BigInt("0x" + (0, _noble_hashes_utils_js.bytesToHex)(IL));
			hdkey.publicKey = _noble_secp256k1.Point.BASE.multiply(tweakInt).add(_noble_secp256k1.Point.fromHex((0, _noble_hashes_utils_js.bytesToHex)(this.publicKey))).toBytes(true);
		} catch {
			throw new Error("Failed to derive child key: invalid key material");
		}
		hdkey.chainCode = IR;
		hdkey.depth = this.depth + 1;
		hdkey.parentFingerprint = this.fingerprint;
		hdkey.index = index;
		return hdkey;
	}
	sign(hash) {
		if (!this.privateKey) throw new Error("Cannot sign without private key");
		return _noble_secp256k1.sign(hash, this.privateKey).toCompactRawBytes();
	}
	verify(hash, signature) {
		try {
			return _noble_secp256k1.verify(signature, hash, this.publicKey);
		} catch {
			return false;
		}
	}
	wipePrivateData() {
		if (this._privateKey) this._privateKey = randomSecretKey();
		this._privateKey = null;
		return this;
	}
	toJSON() {
		return {
			xpriv: this.privateExtendedKey,
			xpub: this.publicExtendedKey
		};
	}
	static fromMasterSeed(seedBuffer, versions) {
		const I = (0, _noble_hashes_hmac_js.hmac)(_noble_hashes_sha2_js.sha512, MASTER_SECRET, seedBuffer instanceof Buffer ? new Uint8Array(seedBuffer) : seedBuffer);
		const IL = I.slice(0, 32);
		const IR = I.slice(32);
		const hdkey = new HDKey(versions);
		hdkey.chainCode = IR;
		hdkey.privateKey = IL;
		return hdkey;
	}
	static fromExtendedKey(base58key, versions, _skipVerification) {
		versions = versions || BITCOIN_VERSIONS;
		const hdkey = new HDKey(versions);
		const keyBuffer = base58check.decode(base58key);
		const version = new DataView(keyBuffer.buffer).getUint32(0);
		if (version !== versions.private && version !== versions.public) throw new Error("Version mismatch: does not match private or public");
		hdkey.depth = keyBuffer[4];
		hdkey.parentFingerprint = new DataView(keyBuffer.buffer).getUint32(5);
		hdkey.index = new DataView(keyBuffer.buffer).getUint32(9);
		hdkey.chainCode = keyBuffer.slice(13, 45);
		const key = keyBuffer.slice(45);
		if (key[0] === 0) {
			if (version !== versions.private) throw new Error("Version mismatch: version does not match private");
			hdkey.privateKey = key.slice(1);
		} else {
			if (version !== versions.public) throw new Error("Version mismatch: version does not match public");
			hdkey.publicKey = key;
		}
		return hdkey;
	}
	static fromJSON(obj, versions) {
		return HDKey.fromExtendedKey(obj.xpriv || obj.xpub, versions);
	}
};
//#endregion
exports.HARDENED_OFFSET = HARDENED_OFFSET;
exports.HDKey = HDKey;
exports.default = HDKey;

//# sourceMappingURL=index.cjs.map