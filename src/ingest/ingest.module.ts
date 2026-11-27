import { Module } from '@nestjs/common';
import { CATALOG_STORE } from './catalog-store.js';
import { IngestService } from './ingest.service.js';
import { TypeOrmCatalogStore } from './typeorm-catalog-store.js';

@Module({
  providers: [IngestService, { provide: CATALOG_STORE, useClass: TypeOrmCatalogStore }],
  exports: [IngestService],
})
export class IngestModule {}
