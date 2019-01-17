import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {Migration} from '../models';
import {MysqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class MigrationRepository extends DefaultCrudRepository<
  Migration,
  typeof Migration.prototype.id
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(Migration, dataSource);
  }
}
