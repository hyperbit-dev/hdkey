/**
 * HDKey (Hierarchical Deterministic Key) - BIP32 implementation
 * Uses @noble/secp256k1 and @scure/base for pure JS implementation
 */
export declare const HARDENED_OFFSET = 2147483648;
export interface Versions {
    private: number;
    public: number;
}
export interface HDKeyJSON {
    xpriv: string | null;
    xpub: string;
}
export declare class HDKey {
    versions: Versions;
    depth: number;
    index: number;
    parentFingerprint: number;
    chainCode: Uint8Array | null;
    private _privateKey;
    private _publicKey;
    private _identifier;
    private _fingerprint;
    private setPublicKey;
    private serialize;
    constructor(versions?: Versions);
    get fingerprint(): number;
    get identifier(): Uint8Array | null;
    get pubKeyHash(): Uint8Array | null;
    get privateKey(): Uint8Array | null;
    set privateKey(value: Uint8Array);
    get publicKey(): Uint8Array | null;
    set publicKey(value: Uint8Array);
    get privateExtendedKey(): string | null;
    get publicExtendedKey(): string;
    derive(path: string): HDKey;
    deriveChild(index: number): HDKey;
    sign(hash: Uint8Array): Uint8Array;
    verify(hash: Uint8Array, signature: Uint8Array): boolean;
    wipePrivateData(): HDKey;
    toJSON(): HDKeyJSON;
    static fromMasterSeed(seedBuffer: Uint8Array | Buffer, versions?: Versions): HDKey;
    static fromExtendedKey(base58key: string, versions?: Versions, _skipVerification?: boolean): HDKey;
    static fromJSON(obj: HDKeyJSON, versions?: Versions): HDKey;
}
export default HDKey;
//# sourceMappingURL=index.d.ts.map