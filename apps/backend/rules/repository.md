# Repository Design Rule

## One Repository Per Aggregate

Create repositories for **aggregate roots only**, not every entity.

```typescript
// ❌ Bad: Repository per entity
@Injectable()
class NoteRepository { ... }

@Injectable()
class PrescriptionRepository { ... }

@Injectable()
class AppointmentRepository { ... }

// ✅ Good: Repository per aggregate root
@Injectable()
class AppointmentRepository { ... }  // Manages Appointment aggregate (includes Notes, Prescriptions)
```

## Domain Language, Not Database Language

Methods express **use cases**, not table operations.

```typescript
// ❌ Bad: Table-centric
@Injectable()
class AppointmentRepository {
  async findById(id: number): Promise<Appointment | null> { ... }

  async findByColumn(column: string, value: unknown): Promise<Appointment[]> { ... }

  async insert(appointment: Appointment): Promise<void> { ... }

  async update(appointment: Appointment): Promise<void> { ... }
}

// ✅ Good: Domain-centric
@Injectable()
class AppointmentRepository {
  async findUpcomingForPatient(patientId: PatientId): Promise<Appointment[]> { ... }

  async findPendingConfirmationsForDoctor(doctorId: DoctorId): Promise<Appointment[]> { ... }

  async save(appointment: Appointment): Promise<void> { ... }  // Handles insert/update

  async cancel(appointment: Appointment, reason: CancellationReason): Promise<void> { ... }
}
```

## Checklist

- [ ] One repository per aggregate root
- [ ] No `findById`/`findByColumn`/`insert`/`update`/`delete` methods
- [ ] Method names describe **what** not **how**
- [ ] Parameters are domain value objects, not primitives
- [ ] Repository injected via `@Injectable()`, used in services/domain layer
