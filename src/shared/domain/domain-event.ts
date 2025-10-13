export interface DomainEvent {
  occurredOn: Date;
  eventName: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventName: string;

  constructor(eventName: string) {
    this.occurredOn = new Date();
    this.eventName = eventName;
  }
}
