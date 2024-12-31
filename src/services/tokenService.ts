interface ResetToken {
  token: string;
  email: string;
  createdAt: number;
  expiresAt: number;
}

class TokenService {
  private readonly RESET_TOKEN_EXPIRY = 3600000; // 1 hour in milliseconds
  private readonly TOKEN_KEY = 'password_reset_tokens';

  private getStoredTokens(): ResetToken[] {
    const tokens = localStorage.getItem(this.TOKEN_KEY);
    return tokens ? JSON.parse(tokens) : [];
  }

  private saveTokens(tokens: ResetToken[]): void {
    localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
  }

  generateResetToken(email: string): string {
    // Generate a secure token (in real app, this would be more secure)
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const now = Date.now();

    const resetToken: ResetToken = {
      token,
      email,
      createdAt: now,
      expiresAt: now + this.RESET_TOKEN_EXPIRY
    };

    // Store token
    const tokens = this.getStoredTokens();
    // Remove any existing tokens for this email
    const filteredTokens = tokens.filter(t => t.email !== email);
    this.saveTokens([...filteredTokens, resetToken]);

    return token;
  }

  validateResetToken(token: string): { isValid: boolean; email?: string } {
    const tokens = this.getStoredTokens();
    const resetToken = tokens.find(t => t.token === token);

    if (!resetToken) {
      return { isValid: false };
    }

    const now = Date.now();
    if (now > resetToken.expiresAt) {
      // Remove expired token
      this.removeToken(token);
      return { isValid: false };
    }

    return { isValid: true, email: resetToken.email };
  }

  removeToken(token: string): void {
    const tokens = this.getStoredTokens();
    const filteredTokens = tokens.filter(t => t.token !== token);
    this.saveTokens(filteredTokens);
  }

  cleanupExpiredTokens(): void {
    const tokens = this.getStoredTokens();
    const now = Date.now();
    const validTokens = tokens.filter(token => token.expiresAt > now);
    this.saveTokens(validTokens);
  }
}

export const tokenService = new TokenService(); 