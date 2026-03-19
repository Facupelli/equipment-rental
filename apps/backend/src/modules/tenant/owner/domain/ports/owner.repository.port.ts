import { Owner } from '../entities/owner.entity';

export abstract class OwnerRepositoryPort {
  abstract load(id: string): Promise<Owner | null>;
  abstract save(owner: Owner): Promise<string>;
}
