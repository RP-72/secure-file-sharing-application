import { Buffer } from 'buffer';
import { kmsApi } from '../services/kmsApi';

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

// Function to get encryption key from KMS
export async function getKeyFromKMS(fileId: string): Promise<CryptoKey> {
  try {
    const response = await kmsApi.get(`/keys/${fileId}`);
    const keyBase64 = response.data.encryption_key;
    
    // Convert base64 key to ArrayBuffer
    const keyBytes = Uint8Array.from(atob(keyBase64), c => c.charCodeAt(0));
    
    // Import the key for use with Web Crypto API
    return await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt", "decrypt"]
    );
  } catch (error) {
    console.error('Error getting key from KMS:', error);
    throw new Error('Failed to retrieve encryption key');
  }
}

// Function to store encryption key in KMS
async function storeKeyInKMS(fileId: string, key: CryptoKey): Promise<void> {
  try {
    // Export the key to raw format
    const exportedKey = await window.crypto.subtle.exportKey("raw", key);
    
    // Convert to base64 string
    const keyBase64 = btoa(
      String.fromCharCode(...new Uint8Array(exportedKey))
    );
    
    // Store key in KMS
    await kmsApi.post(`/keys/${fileId}`, {
      encryption_key: keyBase64
    });
  } catch (error) {
    console.error('Error storing key in KMS:', error);
    throw new Error('Failed to store encryption key');
  }
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
): Promise<{ encryptedData: ArrayBuffer; iv: Uint8Array; key: CryptoKey }> => {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await generateEncryptionKey();
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    fileData
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

export const storeKeyForFile = async (fileId: string, key: CryptoKey): Promise<void> => {
  await storeKeyInKMS(fileId, key);
};