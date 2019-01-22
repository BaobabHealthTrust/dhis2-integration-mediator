import { Entity, model, property } from '@loopback/repository';

@model()
export class DataElement extends Entity {
  @property({
    type: 'number',
    id: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  dataElementName: string;

  @property({
    type: 'string',
    required: true,
  })
  dataElementId: string;

  @property({
    type: 'number',
    required: true,
  })
  dataSetId: number;

  constructor(data?: Partial<DataElement>) {
    super(data);
  }
}
