import { DataSet } from './data-set.model';
import { Entity, model, property } from '@loopback/repository';

@model()
export class Client extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  constructor(data?: Partial<Client>) {
    super(data);
  }
}
