import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {DataElement} from '../models';
import {MysqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class DataElementRepository extends DefaultCrudRepository<
  DataElement,
  typeof DataElement.prototype.id
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(DataElement, dataSource);
  }
}
