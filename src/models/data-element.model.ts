import {Entity, model, property} from '@loopback/repository';

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
  dataElement: string;

  @property({
    type: 'object',
    required: true,
  })
  validationRules: object;

  @property({
    type: 'number',
    required: true,
  })
  dataSetId: number;

  constructor(data?: Partial<DataElement>) {
    super(data);
  }
}
