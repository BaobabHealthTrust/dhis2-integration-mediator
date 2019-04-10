import {Entity, model, property} from '@loopback/repository';

@model()
export class FailQueue extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  migrationId: number;

  @property({
    type: 'number',
    required: true,
  })
  productId: number;

  @property({
    type: 'number',
    required: true,
  })
  attempts: number;

  constructor(data?: Partial<FailQueue>) {
    super(data);
  }
}
