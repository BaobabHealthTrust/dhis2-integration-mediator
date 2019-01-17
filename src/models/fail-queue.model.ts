import {Entity, model, property} from '@loopback/repository';

@model()
export class Fail_queue extends Entity {
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
  dataElementId: number;

  @property({
    type: 'date',
  })
  migratedAt?: string;

  @property({
    type: 'number',
    required: true,
  })
  attempts: number;

  constructor(data?: Partial<Fail_queue>) {
    super(data);
  }
}
