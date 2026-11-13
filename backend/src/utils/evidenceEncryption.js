import crypto from "crypto";

const getEncryptionKey = () => {
  const key = process.env.EVIDENCE_ENCRYPTION_KEY;

  if (!key || !/^[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(
      "EVIDENCE_ENCRYPTION_KEY must be a valid 64-character hexadecimal key"
    );
  }

  return Buffer.from(key, "hex");
};

export const calculateSHA256 = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};

export const encryptEvidence = (buffer) => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  const encrypted = Buffer.concat([
    cipher.update(buffer),
    cipher.final()
  ]);

  const authTag = cipher.getAuthTag();

  // File format: 12-byte IV + 16-byte authentication tag + ciphertext
  return Buffer.concat([iv, authTag, encrypted]);
};

export const decryptEvidence = (encryptedBuffer) => {
  if (!Buffer.isBuffer(encryptedBuffer) || encryptedBuffer.length < 28) {
    throw new Error("Encrypted evidence file is invalid or incomplete");
  }

  const key = getEncryptionKey();

  const iv = encryptedBuffer.subarray(0, 12);
  const authTag = encryptedBuffer.subarray(12, 28);
  const encryptedData = encryptedBuffer.subarray(28);

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);

  decipher.setAuthTag(authTag);

  return Buffer.concat([
    decipher.update(encryptedData),
    decipher.final()
  ]);
};