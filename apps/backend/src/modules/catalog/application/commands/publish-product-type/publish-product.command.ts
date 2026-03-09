export class PublishProductTypeCommand {
  constructor(public readonly productTypeId: string) {}
}

export class RetireProductTypeCommand {
  constructor(public readonly productTypeId: string) {}
}
