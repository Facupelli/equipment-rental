import { Tenant } from './tenant.entity';
import { TenantRegisteredEvent } from '../../public/events/tenant-registered.event';
import { TenantConfig } from '../value-objects/tenant-config.value-object';

describe('Tenant', () => {
  it('records TenantRegisteredEvent when created', () => {
    const tenant = Tenant.create({
      name: 'Acme Rentals',
      slug: 'acme-rentals',
    });

    const events = tenant.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(TenantRegisteredEvent);
    expect(events[0]).toMatchObject({
      eventName: TenantRegisteredEvent.EVENT_NAME,
      aggregateId: tenant.id,
      aggregateType: 'Tenant',
      tenantId: tenant.id,
      slug: tenant.slug,
    });
  });

  it('drains recorded events only once', () => {
    const tenant = Tenant.create({
      name: 'Acme Rentals',
      slug: 'acme-rentals',
    });

    expect(tenant.pullDomainEvents()).toHaveLength(1);
    expect(tenant.pullDomainEvents()).toHaveLength(0);
  });

  it('does not record historical events when reconstituted', () => {
    const tenant = Tenant.reconstitute({
      id: 'tenant-1',
      name: 'Acme Rentals',
      slug: 'acme-rentals',
      config: TenantConfig.default(),
      billingUnits: [],
    });

    expect(tenant.pullDomainEvents()).toHaveLength(0);
  });
});
