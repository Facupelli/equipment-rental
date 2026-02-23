import { Owner } from '../entities/owner.entity';

export abstract class OwnerRepositoryPort {
  abstract save(location: Owner): Promise<string>;
  abstract findOne(id: string): Promise<Owner | null>;
  abstract findAll(): Promise<Owner[]>;
}
