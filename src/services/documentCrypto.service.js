import crypto from 'crypto';

/**
 * Calculates SHA-256 hash of a file Buffer or base64 data URL
 * @param {Buffer|string} input - File buffer or base64 data string
 * @returns {string} 64-character lowercase hexadecimal SHA-256 string
 */
export function computeFileSha256(input) {
  let buffer;
  if (Buffer.isBuffer(input)) {
    buffer = input;
  } else if (typeof input === 'string') {
    if (input.startsWith('data:')) {
      // Data URL format: data:[<mediatype>][;base64],<data>
      const base64Data = input.split(',')[1] || '';
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      buffer = Buffer.from(input, 'utf-8');
    }
  } else {
    throw new Error('Unsupported input type for SHA-256 computation');
  }

  return crypto.createHash('sha256').update(buffer).digest('hex').toLowerCase();
}

/**
 * Cryptographically verifies if the provided document content matches the expected hash
 * @param {Buffer|string} content - Document bytes or base64
 * @param {string} expectedHash - Expected SHA-256 hash
 * @returns {{ verified: boolean, actualHash: string, expectedHash: string }}
 */
export function verifyDocumentIntegrity(content, expectedHash) {
  if (!expectedHash || typeof expectedHash !== 'string') {
    return { verified: false, error: 'Expected hash is required for verification' };
  }

  const cleanExpected = expectedHash.trim().toLowerCase().replace(/^0x/, '');
  const actualHash = computeFileSha256(content);

  const verified = actualHash === cleanExpected;
  return {
    verified,
    actualHash,
    expectedHash: cleanExpected,
  };
}
