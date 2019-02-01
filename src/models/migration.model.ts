import {Entity, model, property} from '@loopback/repository';

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
  uploadedAt?: string;

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
  })
  totalMigratedElements?: number;

  @property({
    type: 'number',
  })
  totalDataElements?: number;

  @property({
    type: 'number',
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

  constructor(data?: Partial<Migration>) {
    super(data);
  }
}
