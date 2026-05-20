# @hyperbitjs/hdkey

[![npm version](https://img.shields.io/npm/v/@hyperbitjs/hdkey.svg?style=flat-square)](https://www.npmjs.org/package/@hyperbitjs/hdkey)
[![npm downloads](https://img.shields.io/npm/dm/@hyperbitjs/hdkey.svg?style=flat-square)](https://www.npmjs.org/package/@hyperbitjs/hdkey)
[![license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](LICENSE)
[![CI/CD](https://github.com/hyperbit-dev/hdkey/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/hyperbit-dev/hdkey/actions)

BIP32 hierarchical deterministic (HD) key derivation for Node.js and the browser. Generate and manage entire key hierarchies from a single master seed using the Bitcoin Improvement Proposal 32 standard.

## Features

- **BIP32 Standard**: Full compliance with [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) specification
- **Full TypeScript support**: Includes complete type definitions
- **Master seed derivation**: Create unlimited key hierarchies from a single seed
- **Key path derivation**: Support for both hardened and normal derivation paths
- **Extended keys**: Support for xprv and xpub extended key formats
- **Cryptographic operations**: Sign and verify with derived keys
- **Cross-platform**: Node.js and browser compatible

## Installation

```bash
npm install @hyperbitjs/hdkey
```

## Quick Start

```typescript
import { HDKey } from '@hyperbitjs/hdkey';
import { randomBytes } from 'crypto';

// Create from master seed (commonly from BIP39 mnemonic)
const seed = randomBytes(64);
const masterKey = HDKey.fromMasterSeed(seed);

// Access extended keys
console.log(masterKey.privateExtendedKey); // xprv...
console.log(masterKey.publicExtendedKey); // xpub...

// Derive a BIP44 path (Bitcoin account 0, address 0)
const accountKey = masterKey.derive("m/44'/0'/0'");
const changeKey = accountKey.derive('m/0/0');

// Get the key pair
console.log(changeKey.privateKey); // Buffer (32 bytes)
console.log(changeKey.publicKey); // Buffer (33 bytes compressed)
```

## API Reference

### Static Methods

#### `HDKey.fromMasterSeed(seed, versions?)`

Creates an HDKey from a master seed buffer. The seed should be 64 bytes (512 bits).

```typescript
const seed = randomBytes(64);
const hdkey = HDKey.fromMasterSeed(seed);
console.log(hdkey.privateExtendedKey); // xprv...
```

#### `HDKey.fromExtendedKey(xkey, versions?, skipVerification?)`

Creates an HDKey from an extended key string (xprv or xpub). Useful for importing previously generated keys.

```typescript
const xprv = 'xprv9s21ZrQH143K3...';
const hdkey = HDKey.fromExtendedKey(xprv);

const xpub = 'xpub661MyMwAqRbc...';
const publicKey = HDKey.fromExtendedKey(xpub);
```

#### `HDKey.fromJSON(obj)`

Creates an HDKey from a JSON object previously created with `toJSON()`.

```typescript
const hdkey = HDKey.fromMasterSeed(seed);
const json = hdkey.toJSON();
const hdkey2 = HDKey.fromJSON(json);
```

### Instance Methods

#### `derive(path: string): HDKey`

Derives a child key at the specified BIP32 path from the current key. Supports both hardened (`'`) and normal paths.

```typescript
const masterKey = HDKey.fromMasterSeed(seed);

// Standard derivation (account-level)
const accountKey = masterKey.derive("m/44'/0'/0'");

// Further derivation (address-level)
const addressKey = accountKey.derive('m/0/0');

// Complete BIP44 path in one call
const finalKey = masterKey.derive("m/44'/0'/0'/0/0");
```

Common BIP44 paths:

- `m/44'/0'/0'/0/0` - Bitcoin mainnet, first address
- `m/44'/60'/0'/0/0` - Ethereum mainnet, first address
- `m/44'/1'/0'/0/0` - Bitcoin testnet, first address

#### `sign(hash: Buffer): Buffer`

Signs a message hash with the private key. Returns a signature buffer.

```typescript
const { createHash } = require('crypto');
const message = Buffer.from('Sign this message');
const hash = createHash('sha256').update(message).digest();
const signature = hdkey.sign(hash);
```

#### `verify(hash: Buffer, signature: Buffer): boolean`

Verifies a signature against the public key. Returns true if valid.

```typescript
const isValid = hdkey.verify(hash, signature);
```

#### `wipePrivateData(): void`

Securely wipes the private key from memory. After calling this, the key will only contain public information (xpub).

```typescript
const hdkey = HDKey.fromMasterSeed(seed);
hdkey.wipePrivateData();
// Now hdkey.privateKey is undefined
```

#### `toJSON(): object`

Serializes the key to a JSON-compatible object.

```typescript
const json = hdkey.toJSON();
// { xpriv: 'xprv...', xpub: 'xpub...' }
```

### Properties

- **`privateKey: Buffer`** - The 32-byte private key
- **`publicKey: Buffer`** - The 33-byte compressed public key
- **`chainCode: Buffer`** - The 32-byte chain code
- **`privateExtendedKey: string`** - The xprv string
- **`publicExtendedKey: string`** - The xpub string
- **`fingerprint: Buffer`** - The 4-byte key fingerprint

## Usage Examples

### Multi-Level Derivation

```typescript
import { HDKey } from '@hyperbitjs/hdkey';
import { randomBytes } from 'crypto';

// Create master key from BIP39 seed
const seed = randomBytes(64);
const master = HDKey.fromMasterSeed(seed);

// Derive Bitcoin mainnet account 0
const bitcoin = master.derive("m/44'/0'/0'");

// Generate 5 addresses from this account
for (let i = 0; i < 5; i++) {
  const address = bitcoin.derive(`m/0/${i}`);
  console.log(`Address ${i}:`, address.publicKey.toString('hex'));
}
```

### Importing Extended Public Keys

```typescript
// Create a public-key-only wallet (air-gapped)
const xpub = 'xpub661MyMwAqRbcF...';
const publicKey = HDKey.fromExtendedKey(xpub);

// Can derive child keys (public derivation only)
const address = publicKey.derive('m/0/0');
console.log(address.publicKey); // Works!
console.log(address.privateKey); // undefined
```

### Signing Message

```typescript
import { createHash } from 'crypto';

const message = Buffer.from('Verify my identity');
const hash = createHash('sha256').update(message).digest();

// Sign with derived key
const signature = addressKey.sign(hash);

// Verify with the same key
const isValid = addressKey.verify(hash, signature);
console.log('Signature valid:', isValid);
```

## Type Definitions

```typescript
export interface IHDKey {
  privateKey?: Buffer;
  publicKey: Buffer;
  chainCode: Buffer;
  fingerprint: Buffer;
  privateExtendedKey?: string;
  publicExtendedKey: string;

  derive(path: string): HDKey;
  sign(hash: Buffer): Buffer;
  verify(hash: Buffer, signature: Buffer): boolean;
  wipePrivateData(): void;
  toJSON(): { xpriv?: string; xpub: string };
}
```

## Browser Compatibility

This library works in modern browsers. Use a bundler like Webpack, Vite, or Rollup:

```html
<script type="module">
  import { HDKey } from 'https://cdn.jsdelivr.net/npm/@hyperbitjs/hdkey/dist/index.mjs';

  const xpub = 'xpub...';
  const key = HDKey.fromExtendedKey(xpub);
</script>
```

## Security Notes

- **Private key handling**: Never expose private keys or xprv strings
- **Key storage**: Store xprv only in encrypted form
- **Public-only wallets**: Use xpub for watch-only wallets in untrusted environments
- **Hardened derivation**: Use hardened paths (`'`) for account-level keys
- **Wipe data**: Use `wipePrivateData()` when done with private keys

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING](CONTRIBUTING.md) guide first.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint

# Build
npm run build

# Format code
npm run format
```

## License

MIT © [Hyperbit](https://github.com/hyperbit-dev)

## Related Projects

- [@hyperbitjs/eckey](https://github.com/hyperbit-dev/eckey) - Elliptic curve cryptography
- [@hyperbitjs/mnemonic](https://github.com/hyperbit-dev/mnemonic) - BIP39 seed phrases
- [@hyperbitjs/chains](https://github.com/hyperbit-dev/chains) - Blockchain network definitions

## References

- [BIP32 Specification](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP44 Specification](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [BIP32.org](http://bip32.org/)
- [bitcoinjs-lib HDNode](https://github.com/bitcoinjs/bitcoinjs-lib)

## Support

For issues, questions, or suggestions:

- Open an issue on [GitHub](https://github.com/hyperbit-dev/hdkey/issues)
- Check existing documentation and examples
- Review our [CHANGELOG](CHANGELOG.md) for version history

## Overview
This project lives at `hdkey` and is part of the broader multi-project workspace.
**Description:** Bitcoin BIP32 hierarchical deterministic keys
## Purpose
- Deliver the core capability owned by this project.
- Provide stable commands and interfaces for other apps/packages in the workspace.
- Keep implementation details localized so changes stay maintainable.
## Architecture Notes
- Type: **Project**
- Package manager metadata source: `package.json`
- Runtime entry hints: `./dist/index.cjs`
## Setup
1. Install dependencies from this directory:
```bash
npm install
```
2. Run key scripts as needed (see script table below).
## NPM Scripts
| Script | Command |
|---|---|
| `build` | `vite build` |
| `build:watch` | `vite build --watch` |
| `dev` | `vite build --watch` |
| `type-check` | `tsc --noEmit` |
| `lint` | `eslint . --max-warnings 0` |
| `lint:fix` | `eslint . --fix` |
| `format` | `prettier --write .` |
| `format:check` | `prettier --check .` |
| `test` | `vitest --run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest --coverage` |
| `validate` | `npm run type-check && npm run lint && npm run test` |
| `prepublishOnly` | `npm run build && npm run validate` |
## Dependencies
### Production
- `bs58check`: `^2.1.2`
- `hash.js`: `^1.1.7`
- `secp256k1`: `^5.0.1`
### Development
- `@types/node`: `^20.10.0`
- `@typescript-eslint/eslint-plugin`: `^6.21.0`
- `@typescript-eslint/parser`: `^6.21.0`
- `@vitest/coverage-v8`: `^1.1.0`
- `eslint`: `^8.56.0`
- `prettier`: `^3.0.3`
- `secure-random`: `^1.1.1`
- `typescript`: `^5.3.3`
- `vite`: `^5.0.11`
- `vitest`: `^1.1.3`
## Configuration
- Primary config source: `package.json`
- No `.env.example` detected in this directory.
- Add project-specific operational notes to `MEMORY_BANK.md`.
## Development Workflow
1. Make changes in focused modules.
2. Run the smallest relevant script/test first.
3. Run full validation scripts before merging.
4. Update this README and memory bank whenever behavior/contracts change.
## Testing and Validation
- Prefer script-driven checks from the table above (for example: `test`, `build`, `lint`).
- If this project has no tests yet, add smoke checks and document them in `MEMORY_BANK.md`.
## LLM Context
When using an LLM coding assistant in this folder, always include:
- Exact target file paths and expected behavior changes.
- Validation command(s) run after edits.
- Runtime/config assumptions (.env, API keys, ports, external services).

## Memory Bank
See `MEMORY_BANK.md` for operational context, commands, and troubleshooting notes.
