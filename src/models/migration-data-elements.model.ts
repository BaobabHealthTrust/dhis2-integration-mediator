import { Entity, model, property } from '@loopback/repository';

@model()
export class MigrationDataElements extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  organizationUnitCode: string;

  @property({
    type: 'number',
    required: true,
  })
  dataElementId: number;

  @property({
    type: 'number',
    required: true,
  })
  migrationId: number;

  @property({
    type: 'number',
    required: true,
  })
  value: number;

  @property({
    type: 'number',
    required: true,
  })
  isValueValid: boolean;

  @property({
    type: 'number',
    required: true,
  })
  isElementAuthorized: boolean;

  @property({
    type: 'number',
    required: true,
  })
  isProcessed: boolean;

  @property({
    type: 'number',
    required: true,
  })
  isMigrated: boolean;

  @property({
    type: 'string',
    required: true,
  })
  period: string;

  constructor(data?: Partial<MigrationDataElements>) {
    super(data);
  }
}
