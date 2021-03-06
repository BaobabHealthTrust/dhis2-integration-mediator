import { Entity, model, property } from '@loopback/repository';
import { DataElement } from './data-element.model';

@model()
export class DataSet extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  clientId: number;

  @property({
    type: 'string',
    required: true,
  })
  description: string;

  @property({
    type: 'string',
    required: true,
  })
  categoryCombo: string;

  @property({
    type: 'string',
    required: true,
  })
  dhis2Id: string;

  constructor(data?: Partial<DataSet>) {
    super(data);
  }
}
