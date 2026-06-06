import { NfcPayload } from '../types';

/**
 * Decrypts AES-256-GCM encrypted NDEF text payload from the Flutter app.
 * The payload format is expected to be "iv_base64:ciphertext_base64"
 */
export async function decryptNfcPayload(encryptedString: string): Promise<NfcPayload> {
  const parts = encryptedString.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted payload format. Expected "iv:ciphertext"');
  }

  const ivBase64 = parts[0];
  const ciphertextBase64 = parts[1];

  const keyStr = 'SMARTDISPATCH_AES256_KEY_2026_V1'; // Must match Flutter's key exactly
  const encoder = new TextEncoder();
  
  // 1. Convert Base64 strings to Uint8Arrays
  const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
  const ciphertext = Uint8Array.from(atob(ciphertextBase64), c => c.charCodeAt(0));

  // 2. Import the raw key
  const rawKey = encoder.encode(keyStr);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 3. Decrypt
  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      ciphertext
    );

    // 4. Parse the JSON string
    const decoder = new TextDecoder();
    const jsonStr = decoder.decode(decryptedBuffer);
    return JSON.parse(jsonStr) as NfcPayload;
  } catch (error) {
    console.error("AES Decryption failed", error);
    throw new Error("Failed to decrypt NFC tag. The tag might be tampered with or corrupted.");
  }
}
