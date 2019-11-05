import { Entity, model, property } from '@loopback/repository';

@model()
export class Migration extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'date',
  })
  uploadedAt?: Date;

  @property({
    type: 'date',
  })
  structureValidatedAt?: Date;

  @property({
    type: 'date',
  })
  structureFailedValidationAt?: Date;

  @property({
    type: 'date',
  })
  elementsAuthorizationAt?: Date;

  @property({
    type: 'date',
  })
  elementsFailedAuthorizationAt?: Date;

  @property({
    type: 'date',
  })
  valuesValidatedAt?: Date;

  @property({
    type: 'date',
  })
  valuesFailedValidationAt?: Date;

  @property({
    type: 'date',
  })
  reportDispatchedAt?: Date;

  @property({
    type: 'number',
    default: 0,
  })
  totalMigratedElements?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalDataElements?: number;

  @property({
    type: 'number',
    default: 0,
  })
  totalFailedElements?: number;

  @property({
    type: 'date',
  })
  migrationCompletedAt?: string;

  @property({
    type: 'number',
    required: true,
  })
  clientId: number;

  @property({
    type: 'string',
    required: true,
  })
  channelId: string;
  
  @property({
    type: 'date',
  })
  createdAt?: string;

  constructor(data?: Partial<Migration>) {
    super(data);
  }
}
