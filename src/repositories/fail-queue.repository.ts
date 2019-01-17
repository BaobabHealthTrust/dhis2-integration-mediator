import {DefaultCrudRepository, juggler} from '@loopback/repository';
import {FailQueue} from '../models';
import {MysqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class FailQueueRepository extends DefaultCrudRepository<
  FailQueue,
  typeof FailQueue.prototype.id
> {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
  ) {
    super(FailQueue, dataSource);
  }
}
