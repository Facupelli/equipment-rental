export class InvitationAlreadyAcceptedException extends Error {
  constructor(invitationId: string) {
    super(`Invitation '${invitationId}' has already been accepted.`);
    this.name = 'InvitationAlreadyAcceptedException';
  }
}

export class InvitationExpiredException extends Error {
  constructor(invitationId: string) {
    super(`Invitation '${invitationId}' has expired.`);
    this.name = 'InvitationExpiredException';
  }
}
