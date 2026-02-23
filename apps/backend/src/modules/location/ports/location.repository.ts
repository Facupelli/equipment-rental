import { Location } from '../entities/location.entity';

export abstract class LocationRepositoryPort {
  abstract save(location: Location): Promise<string>;
  abstract findOne(id: string): Promise<Location | null>;
  abstract findAll(): Promise<Location[]>;
}
