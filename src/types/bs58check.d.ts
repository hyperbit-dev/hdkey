/**
 * Type declarations for bs58check module
 * @link https://github.com/bitcoinjs/bs58check
 */

declare module 'bs58check' {
  /**
   * Encode a buffer to a base58check string
   */
  function encode(payload: Buffer | Uint8Array): string;

  /**
   * Decode a base58check string to a buffer
   */
  function decode(s: string): Buffer;

  export { encode, decode };
}
