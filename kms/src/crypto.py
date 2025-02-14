from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import base64

# Load master key from environment variable
MASTER_KEY = os.environ.get('KMS_MASTER_KEY')
if not MASTER_KEY:
    raise ValueError("Master key not configured!")

# Convert master key to bytes and create AESGCM instance
master_key_bytes = base64.b64decode(MASTER_KEY)
aes_gcm = AESGCM(master_key_bytes)

def encrypt_key(key_data: bytes) -> tuple[bytes, bytes]:
    """Encrypt a key using the master key"""
    nonce = os.urandom(12)
    encrypted_key = aes_gcm.encrypt(nonce, key_data, None)
    return encrypted_key, nonce

def decrypt_key(encrypted_key: bytes, nonce: bytes) -> bytes:
    """Decrypt a key using the master key"""
    return aes_gcm.decrypt(nonce, encrypted_key, None) 