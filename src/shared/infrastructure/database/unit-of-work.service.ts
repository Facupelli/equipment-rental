import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { ClsService } from "nestjs-cls";
// biome-ignore lint: /style/useImportType
import { DataSource, EntityManager } from "typeorm";
// biome-ignore lint: /style/useImportType
import { TransactionContext } from "./transaction-context";

@Injectable()
export class UnitOfWork {
	constructor(
		private readonly dataSource: DataSource,
		private readonly cls: ClsService,
		private readonly txContext: TransactionContext,
	) {}

	async execute<T>(work: () => Promise<T>): Promise<T> {
		return this.cls.run(async () => {
			const queryRunner = this.dataSource.createQueryRunner();
			await queryRunner.connect();
			await queryRunner.startTransaction();

			try {
				this.txContext.setEntityManager(queryRunner.manager);
				const result = await work();
				await queryRunner.commitTransaction();
				return result;
			} catch (error) {
				await queryRunner.rollbackTransaction();
				throw error;
			} finally {
				await queryRunner.release();
			}
		});
	}

	getEntityManager(): EntityManager | undefined {
		return this.txContext.getEntityManager();
	}
}
