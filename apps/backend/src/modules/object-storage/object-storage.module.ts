import { Module } from '@nestjs/common';

import { ObjectStoragePort } from './application/ports/object-storage.port';
import { R2ObjectStorageAdapter } from './infrastructure/r2/r2-object-storage.adapter';

@Module({
  providers: [R2ObjectStorageAdapter, { provide: ObjectStoragePort, useExisting: R2ObjectStorageAdapter }],
  exports: [ObjectStoragePort],
})
export class ObjectStorageModule {}
