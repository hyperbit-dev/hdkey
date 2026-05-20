/**
 * Type declarations for secure-random module
 * @link https://www.npmjs.com/package/secure-random
 */

declare module 'secure-random' {
  /**
   * Generate secure random bytes
   * @param length - Number of bytes to generate
   * @param options - Options for output type
   * @returns Random bytes in requested format
   */
  function secureRandom(
    length: number,
    options?: { type: 'Buffer' | 'Uint8Array' | 'Array' }
  ): Buffer | Uint8Array | number[];

  export default secureRandom;
}
