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

  @property({
    type: 'date',
    required: true,
  })
  createdAt: string;

  constructor(data?: Partial<FailQueue>) {
    super(data);
  }
}
