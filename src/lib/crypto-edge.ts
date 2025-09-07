/**
 * Edge Runtime compatible password hashing utilities using Web Crypto API
 * Replaces bcrypt for Cloudflare Pages compatibility
 */

const SALT_ROUNDS = 12;

/**
 * Generate a random salt
 */
async function generateSalt(): Promise<Uint8Array> {
  return crypto.getRandomValues(new Uint8Array(16));
}

/**
 * Hash password with salt using PBKDF2
 */
async function hashPasswordWithSalt(password: string, salt: Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000, // Strong iteration count
      hash: 'SHA-256'
    } as Pbkdf2Params,
    keyMaterial,
    256 // 32 bytes
  );
  
  // Combine salt and hash
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  
  // Convert to base64
  const base64 = btoa(String.fromCharCode.apply(null, Array.from(combined)));
  return base64;
}

/**
 * Hash a password (equivalent to bcrypt.hash)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await generateSalt();
  return await hashPasswordWithSalt(password, salt);
}

/**
 * Verify password against hash (equivalent to bcrypt.compare)
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    // Decode base64 hash
    const binaryString = atob(hash);
    const combined = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      combined[i] = binaryString.charCodeAt(i);
    }
    
    // Extract salt (first 16 bytes) and hash (remaining bytes)
    const salt = combined.slice(0, 16);
    const storedHash = combined.slice(16);
    
    // Hash the input password with the same salt
    const inputHashString = await hashPasswordWithSalt(password, salt);
    const inputBinaryString = atob(inputHashString);
    const inputCombined = new Uint8Array(inputBinaryString.length);
    for (let i = 0; i < inputBinaryString.length; i++) {
      inputCombined[i] = inputBinaryString.charCodeAt(i);
    }
    const inputHash = inputCombined.slice(16);
    
    // Compare hashes
    if (inputHash.length !== storedHash.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < inputHash.length; i++) {
      result |= inputHash[i] ^ storedHash[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification failed:', error);
    return false;
  }
}

/**
 * Check if a hash was created with the old bcrypt format
 */
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2') || hash.startsWith('$2a') || hash.startsWith('$2b') || hash.startsWith('$2y');
}

/**
 * Migrate bcrypt hash to new format by re-hashing
 * This should be called when a user logs in with an old bcrypt hash
 */
export async function migrateBcryptHash(password: string): Promise<string> {
  return await hashPassword(password);
}