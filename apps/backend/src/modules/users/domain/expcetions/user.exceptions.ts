export class InvalidUserNameException extends Error {
  constructor(part: 'first' | 'last') {
    super(`User ${part} name cannot be empty.`);
    this.name = 'InvalidUserNameException';
  }
}

export class UserRefreshTokenNotFoundException extends Error {
  constructor(tokenId: string) {
    super(`Refresh token '${tokenId}' not found.`);
    this.name = 'UserRefreshTokenNotFoundException';
  }
}
