import {DefaultCrudRepository} from '@loopback/repository';
import {Facilities} from '../models';
import {MysqlDataSource} from '../datasources';
import {inject} from '@loopback/core';

export class FacilitiesRepository extends DefaultCrudRepository<
  Facilities,
  typeof Facilities.prototype.id
> {
  constructor(@inject('datasources.mysql') dataSource: MysqlDataSource) {
    super(Facilities, dataSource);
  }
}
