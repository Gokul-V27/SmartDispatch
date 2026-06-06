/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Token storage interface for managing JWT tokens securely
 */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // Unix timestamp
  tokenType: 'Bearer';
}

/**
 * Storage strategy enum
 */
export enum StorageStrategy {
  SESSION_STORAGE = 'sessionStorage',
  LOCAL_STORAGE = 'localStorage',
  MEMORY = 'memory'
}

/**
 * Secure token storage service with multiple storage strategies
 */
class TokenStorageService {
  private readonly TOKEN_KEY = 'smartdispatch_auth_token';
  private memoryStorage: TokenData | null = null;
  private strategy: StorageStrategy = StorageStrategy.SESSION_STORAGE;

  /**
   * Set storage strategy
   */
  setStorageStrategy(strategy: StorageStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get storage instance based on strategy
   */
  private getStorage(): Storage | null {
    switch (this.strategy) {
      case StorageStrategy.SESSION_STORAGE:
        return typeof window !== 'undefined' ? window.sessionStorage : null;
      case StorageStrategy.LOCAL_STORAGE:
        return typeof window !== 'undefined' ? window.localStorage : null;
      case StorageStrategy.MEMORY:
        return null; // Memory storage handled separately
      default:
        return null;
    }
  }

  /**
   * Store token data securely
   */
  setTokenData(tokenData: TokenData): void {
    try {
      if (this.strategy === StorageStrategy.MEMORY) {
        this.memoryStorage = tokenData;
        return;
      }

      const storage = this.getStorage();
      if (storage) {
        // Encrypt or encode token data before storing
        const encodedData = this.encodeTokenData(tokenData);
        storage.setItem(this.TOKEN_KEY, encodedData);
      } else {
        // Fallback to memory storage if storage is not available
        this.memoryStorage = tokenData;
      }
    } catch (error) {
      console.warn('Failed to store token data:', error);
      // Fallback to memory storage
      this.memoryStorage = tokenData;
    }
  }

  /**
   * Retrieve token data
   */
  getTokenData(): TokenData | null {
    try {
      if (this.strategy === StorageStrategy.MEMORY) {
        return this.memoryStorage;
      }

      const storage = this.getStorage();
      if (storage) {
        const encodedData = storage.getItem(this.TOKEN_KEY);
        if (encodedData) {
          return this.decodeTokenData(encodedData);
        }
      } else {
        // Fallback to memory storage
        return this.memoryStorage;
      }
    } catch (error) {
      console.warn('Failed to retrieve token data:', error);
      this.clearTokenData(); // Clear corrupted data
    }
    return null;
  }

  /**
   * Get just the access token
   */
  getAccessToken(): string | null {
    const tokenData = this.getTokenData();
    return tokenData?.accessToken || null;
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    const tokenData = this.getTokenData();
    return tokenData?.refreshToken || null;
  }

  /**
   * Check if token exists and is valid
   */
  hasValidToken(): boolean {
    const tokenData = this.getTokenData();
    if (!tokenData || !tokenData.accessToken) {
      return false;
    }

    // Check if token is expired (with 5-minute buffer)
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    return tokenData.expiresAt > (now + bufferTime);
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const tokenData = this.getTokenData();
    if (!tokenData) {
      return true;
    }
    return Date.now() >= tokenData.expiresAt;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeToExpiry(): number {
    const tokenData = this.getTokenData();
    if (!tokenData) {
      return 0;
    }
    return Math.max(0, tokenData.expiresAt - Date.now());
  }

  /**
   * Clear all token data
   */
  clearTokenData(): void {
    try {
      // Clear memory storage
      this.memoryStorage = null;

      // Clear persistent storage
      const storage = this.getStorage();
      if (storage) {
        storage.removeItem(this.TOKEN_KEY);
      }

      // Also try to clear from both storage types as a safety measure
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage.removeItem(this.TOKEN_KEY);
          window.localStorage.removeItem(this.TOKEN_KEY);
        } catch {
          // Ignore errors for storage clearing
        }
      }
    } catch (error) {
      console.warn('Failed to clear token data:', error);
    }
  }

  /**
   * Update token expiry time
   */
  updateTokenExpiry(expiresAt: number): void {
    const tokenData = this.getTokenData();
    if (tokenData) {
      tokenData.expiresAt = expiresAt;
      this.setTokenData(tokenData);
    }
  }

  /**
   * Simple encoding for token data (not encryption, but obfuscation)
   */
  private encodeTokenData(tokenData: TokenData): string {
    try {
      return btoa(JSON.stringify(tokenData));
    } catch (error) {
      console.warn('Failed to encode token data:', error);
      return JSON.stringify(tokenData);
    }
  }

  /**
   * Decode token data
   */
  private decodeTokenData(encodedData: string): TokenData {
    try {
      return JSON.parse(atob(encodedData));
    } catch (error) {
      console.warn('Failed to decode token data, trying plain JSON:', error);
      try {
        return JSON.parse(encodedData);
      } catch (parseError) {
        console.error('Failed to parse token data:', parseError);
        throw new Error('Invalid token data format');
      }
    }
  }

  /**
   * Parse JWT token to extract expiry time
   */
  parseTokenExpiry(token: string): number {
    try {
      if (!token) {
        return Date.now() + (60 * 60 * 1000);
      }
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      console.warn('Failed to parse token expiry:', error);
      // Default to 1 hour from now
      return Date.now() + (60 * 60 * 1000);
    }
  }

  /**
   * Create token data from login response
   */
  createTokenData(
    accessToken: string, 
    refreshToken?: string, 
    expiresIn?: number
  ): TokenData {
    let expiresAt: number;

    if (expiresIn) {
      // If expiresIn is provided (in seconds), calculate expiry time
      expiresAt = Date.now() + (expiresIn * 1000);
    } else {
      // Try to parse expiry from JWT token
      expiresAt = this.parseTokenExpiry(accessToken);
    }

    return {
      accessToken,
      refreshToken,
      expiresAt,
      tokenType: 'Bearer'
    };
  }
}

// Export singleton instance
export const tokenStorage = new TokenStorageService();
export default tokenStorage;