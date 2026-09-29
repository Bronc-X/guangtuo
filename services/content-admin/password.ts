import {randomBytes, scrypt, scryptSync, timingSafeEqual} from 'node:crypto';

const keyLength = 64;
const cost = 131_072;
const blockSize = 8;
const parallelization = 1;
const maxmem = 256 * 1024 * 1024;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, keyLength, {N: cost, r: blockSize, p: parallelization, maxmem});
  return `scrypt$${cost}$${blockSize}$${parallelization}$${salt.toString('base64url')}$${digest.toString('base64url')}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const [algorithm, rawCost, rawBlockSize, rawParallelization, rawSalt, rawDigest] = encoded.split('$');
  if (algorithm !== 'scrypt' || !rawCost || !rawBlockSize || !rawParallelization || !rawSalt || !rawDigest) return false;
  const expected = Buffer.from(rawDigest, 'base64url');
  const actual = await new Promise<Buffer>((resolve, reject) => {
    scrypt(password, Buffer.from(rawSalt, 'base64url'), expected.length, {
      N: Number(rawCost), r: Number(rawBlockSize), p: Number(rawParallelization), maxmem
    }, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
