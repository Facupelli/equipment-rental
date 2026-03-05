import { PrismaTransactionClient } from 'src/modules/order/domain/ports/order.repository.port';
import { AssetAssignment } from '../entities/asset-assignment.entity';

export abstract class AssetAssignmentRepositoryPort {
  abstract save(assignment: AssetAssignment, tx: PrismaTransactionClient): Promise<void>;
}
