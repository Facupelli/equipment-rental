export class InvalidUserNameException extends Error {
  constructor(part: 'first' | 'last') {
    super(`User ${part} name cannot be empty.`);
    this.name = 'InvalidUserNameException';
  }
}

export class InvalidRoleNameException extends Error {
  constructor() {
    super('Role name cannot be empty.');
    this.name = 'InvalidRoleNameException';
  }
}

export class InvalidRoleCodeException extends Error {
  constructor() {
    super('Role code cannot be empty.');
    this.name = 'InvalidRoleCodeException';
  }
}

export class UserRefreshTokenNotFoundException extends Error {
  constructor(tokenId: string) {
    super(`Refresh token '${tokenId}' not found.`);
    this.name = 'UserRefreshTokenNotFoundException';
  }
}
