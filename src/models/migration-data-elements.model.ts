import {Entity, model, property} from '@loopback/repository';

@model()
export class MigrationDataElements extends Entity {
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
  structureValidatedAt?: string;

  @property({
    type: 'date',
  })
  structureFailedValidationAt?: string;

  @property({
    type: 'date',
  })
  elementsAuthorizationAt?: string;

  @property({
    type: 'date',
  })
  elementsFailedAuthorizationAt?: string;

  @property({
    type: 'date',
  })
  valuesValidatedAt?: string;

  @property({
    type: 'date',
  })
  valuesFailedValidationAt?: string;

  @property({
    type: 'date',
  })
  reportDispatchedAt?: string;

  @property({
    type: 'number',
    required: true,
  })
  totalMigratedElements: number;

  @property({
    type: 'number',
    required: true,
  })
  totalDataElements: number;

  @property({
    type: 'number',
    required: true,
  })
  totalFailedElements: number;

  @property({
    type: 'date',
    required: true,
  })
  migrationCompletedAt: string;

  @property({
    type: 'number',
    required: true,
  })
  clientId: number;

  constructor(data?: Partial<MigrationDataElements>) {
    super(data);
  }
}
