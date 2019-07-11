import { Entity, model, property } from '@loopback/repository';

@model()
export class MigrationDataElements extends Entity {
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
  facilityId: number;

  @property({
    type: 'number',
    required: true,
  })
  value: number;

  @property({
    type: 'string',
    required: true,
  })
  dataElementCode: number;

  @property({
    type: 'string',
    required: true,
  })
  organizationUnitCode: string;

  @property({
    type: 'number',
    required: true,
  })
  isProcessed: boolean;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  migratedAt?: string;

  @property({
    type: 'string',
    required: true,
  })
  reportingPeriod: string;

  @property({
    type: 'date',
    defaultFn: 'now',
  })
  createdAt?: string;

  constructor(data?: Partial<MigrationDataElements>) {
    super(data);
  }
}
