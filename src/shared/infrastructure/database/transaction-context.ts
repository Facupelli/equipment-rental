import { Injectable } from "@nestjs/common";
// biome-ignore lint: /style/useImportType
import { ClsService } from "nestjs-cls";
import type { EntityManager } from "typeorm";

@Injectable()
export class TransactionContext {
	private static readonly MANAGER_KEY = "transactionManager";
	private managerInstances = new Map<string, number>();

	constructor(private readonly cls: ClsService) {}

	setEntityManager(manager: EntityManager) {
		console.log("[TransactionContext] 🔧 SETTING manager");
		this.cls.set(TransactionContext.MANAGER_KEY, manager);
	}

	getEntityManager(): EntityManager | undefined {
		const manager = this.cls.get(TransactionContext.MANAGER_KEY);
		if (manager) {
			const qr = manager.queryRunner;
			const isTransactionActive = qr?.isTransactionActive ?? false;
			const transactionDepth = qr?.transactionDepth ?? 0;
			const isReleased = qr?.isReleased ?? true;

			console.log(
				`[TransactionContext] txActive: ${isTransactionActive} | depth: ${transactionDepth} | released: ${isReleased}`,
			);
		}
		return manager;
	}
}
