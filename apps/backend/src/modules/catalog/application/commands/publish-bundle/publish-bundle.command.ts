export class PublishBundleCommand {
  constructor(public readonly bundleId: string) {}
}

export class RetireBundleCommand {
  constructor(public readonly bundleId: string) {}
}
