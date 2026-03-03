import { Bundle } from '../entities/bundle.entity';

export abstract class BundleRepositoryPort {
  abstract load(id: string): Promise<Bundle | null>;
  abstract save(bundle: Bundle): Promise<string>;
}
