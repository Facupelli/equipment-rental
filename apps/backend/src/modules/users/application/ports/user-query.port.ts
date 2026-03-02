export abstract class UserQueryPort {
  abstract isEmailTaken(email: string): Promise<boolean>;
}
