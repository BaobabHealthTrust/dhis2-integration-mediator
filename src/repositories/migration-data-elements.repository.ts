import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {MigrationDataElements} from '../models';
import {MysqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class MigrationDataElementsRepository extends DefaultCrudRepository<
  MigrationDataElements,
  typeof MigrationDataElements.prototype.id
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(MigrationDataElements, dataSource);
  }
}
