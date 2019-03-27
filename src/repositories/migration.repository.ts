import { DefaultCrudRepository, juggler } from '@loopback/repository';
import { Migration } from '../models';
import { MysqlDataSource } from '../datasources';
import { inject } from '@loopback/context';

export class MigrationRepository extends DefaultCrudRepository<
  Migration,
  typeof Migration.prototype.id
  > {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Migration, dataSource);
  }

  // TODO: clientId will always be a number
  async persistError(clientId: number | undefined, totalDataElements: number) {
    await this.create({
      clientId,
      structureFailedValidationAt: new Date(Date.now()),
      valuesFailedValidationAt: new Date(Date.now()),
      elementsFailedAuthorizationAt: new Date(Date.now()),
      uploadedAt: new Date(Date.now()),
      totalDataElements,
    });
  }

  async startMigration(clientId: number | undefined, totalDataElements: number): Promise<Migration> {
    const date: Date = new Date(Date.now());
    return await this.create({
      clientId,
      structureValidatedAt: date,
      valuesValidatedAt: date,
      uploadedAt: date,
      totalDataElements,
    });
  }
}
