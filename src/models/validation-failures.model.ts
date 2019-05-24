import {Entity, model, property} from '@loopback/repository';

@model()
export class ValidationFailures extends Entity {
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
    type: 'string',
    required: true,
  })
  reason: string;

  @property({
    type: 'string',
    required: true,
  })
  fileName: string;

  @property({
    type: 'date',
    required: true,
  })
  createdAt: string;


  constructor(data?: Partial<ValidationFailures>) {
    super(data);
  }
}
