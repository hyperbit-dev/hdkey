/**
 * Type declarations for secp256k1 module
 * @link https://github.com/cryptocoinjs/secp256k1-node
 */

declare module 'secp256k1' {
  type KeyLike = Buffer | Uint8Array;

  /**
   * Verify a secret key (private key)
   */
  function privateKeyVerify(secretKey: KeyLike): boolean;

  /**
   * Create a public key from a private key
   */
  function publicKeyCreate(
    secretKey: KeyLike,
    compressed?: boolean
  ): Buffer;

  /**
   * Convert a public key to another format
   */
  function publicKeyConvert(
    publicKey: KeyLike,
    compressed?: boolean
  ): Buffer;

  /**
   * Verify a public key
   */
  function publicKeyVerify(publicKey: KeyLike): boolean;

  /**
   * Sign a message using ECDSA
   */
  function ecdsaSign(
    message: KeyLike,
    secretKey: KeyLike
  ): { signature: Buffer; recovery: number };

  /**
   * Verify an ECDSA signature
   */
  function ecdsaVerify(
    signature: KeyLike,
    message: KeyLike,
    publicKey: KeyLike
  ): boolean;

  /**
   * Tweak a private key
   */
  function privateKeyTweakAdd(secretKey: KeyLike, tweak: KeyLike): Buffer;

  /**
   * Tweak a public key
   */
  function publicKeyTweakAdd(publicKey: KeyLike, tweak: KeyLike): Buffer;
}
