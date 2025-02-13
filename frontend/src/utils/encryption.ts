import { Buffer } from 'buffer';

export interface EncryptionResult {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  key: CryptoKey;
}

export interface DecryptionParams {
  encryptedData: ArrayBuffer;
  iv: Uint8Array;
  key: CryptoKey;
}

export const generateEncryptionKey = async (): Promise<CryptoKey> => {
  return await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true, // extractable
    ['encrypt', 'decrypt']
  );
};

export const encryptFile = async (file: File): Promise<EncryptionResult> => {
  const key = await generateEncryptionKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const fileBuffer = await file.arrayBuffer();
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    fileBuffer
  );

  return { encryptedData, iv, key };
};

export const decryptFile = async ({
  encryptedData,
  iv,
  key,
}: DecryptionParams): Promise<ArrayBuffer> => {
  return await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encryptedData
  );
};

export const exportKey = async (key: CryptoKey): Promise<string> => {
  const exportedKey = await window.crypto.subtle.exportKey('raw', key);
  return Buffer.from(exportedKey).toString('base64');
};

export const importKey = async (keyString: string): Promise<CryptoKey> => {
  const keyBuffer = Buffer.from(keyString, 'base64');
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
}; 