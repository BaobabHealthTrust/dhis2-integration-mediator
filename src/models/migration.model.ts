import {Entity, model, property} from '@loopback/repository';

@model()
export class Migration extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  constructor(data?: Partial<Migration>) {
    super(data);
  }
}
