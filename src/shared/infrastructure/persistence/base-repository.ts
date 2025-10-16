// biome-ignore lint: /style/useImportType
import { DataSource, Repository } from "typeorm";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "../database/transaction-context";

export abstract class BaseRepository<T> {
	protected readonly repo: Repository<T>;

	constructor(
		protected readonly entity: new () => T,
		protected readonly dataSource: DataSource,
		protected readonly txContext: TransactionContext,
	) {
		this.repo = this.dataSource.getRepository(entity);
	}

	protected get managerRepo(): Repository<T> {
		const manager = this.txContext.getEntityManager();
		return manager ? manager.getRepository(this.entity) : this.repo;
	}
}
