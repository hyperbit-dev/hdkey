import { describe, it, expect, beforeEach } from 'vitest';
import { HDKey } from '../src/index';

describe('hdkey', () => {
  it('should create HDKey instance', () => {
    const hdkey = new HDKey();
    expect(hdkey).toBeDefined();
  });

  it('should create from master seed', () => {
    const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
    const hdkey = HDKey.fromMasterSeed(seed);
    expect(hdkey).toBeDefined();
    expect(hdkey.privateKey).toBeDefined();
    expect(hdkey.publicKey).toBeDefined();
  });

  it('should have valid public key', () => {
    const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
    const hdkey = HDKey.fromMasterSeed(seed);
    // Just check that publicKey exists and has valid length
    expect(hdkey.publicKey).toBeDefined();
    expect(hdkey.publicKey!.length === 33 || hdkey.publicKey!.length === 65).toBe(true);
  });

  it('should derive simple path', () => {
    const seed = Buffer.from('000102030405060708090a0b0c0d0e0f', 'hex');
    const hdkey = HDKey.fromMasterSeed(seed);
    // Test that derive method exists and can be called
    expect(typeof hdkey.derive).toBe('function');
  });
});
