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

export const encryptFile = async (
  fileData: ArrayBuffer,
  key: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    fileData
  );

  return { encryptedData, iv };
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
  const exported = await window.crypto.subtle.exportKey('raw', key);
  return Buffer.from(exported).toString('base64');
};

export const importKey = async (keyData: string): Promise<CryptoKey> => {
  const keyBuffer = Buffer.from(keyData, 'base64');
  return await window.crypto.subtle.importKey(
    'raw',
    keyBuffer,
    'AES-GCM',
    true,
    ['encrypt', 'decrypt']
  );
};

export const storeKeyForFile = (fileId: string, keyString: string) => {
  sessionStorage.setItem(`file_key_${fileId}`, keyString);
};

export const getKeyForFile = (fileId: string): string | null => {
  return sessionStorage.getItem(`file_key_${fileId}`);
}; 