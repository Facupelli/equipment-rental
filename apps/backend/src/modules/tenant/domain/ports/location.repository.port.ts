import { Location } from '../../location/domain/entities/location.entity';

export abstract class LocationRepositoryPort {
  abstract load(id: string): Promise<Location | null>;
  abstract save(location: Location): Promise<string>;
}
