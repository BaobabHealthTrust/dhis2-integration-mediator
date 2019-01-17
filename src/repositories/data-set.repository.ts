import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {DataSet} from '../models';
import {MysqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class DataSetRepository extends DefaultCrudRepository<
  DataSet,
  typeof DataSet.prototype.id
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(DataSet, dataSource);
  }
}
