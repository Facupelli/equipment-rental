import { InvalidTimezoneException } from '../exceptions/tenant.exceptions';

export function assertValidIanaTimezone(timezone: string): void {
  if (timezone === 'UTC') {
    return;
  }

  const valid = Intl.supportedValuesOf('timeZone');

  if (!valid.includes(timezone)) {
    throw new InvalidTimezoneException(timezone);
  }
}
