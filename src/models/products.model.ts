import {Entity, model, property} from '@loopback/repository';

@model()
export class Products extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  productCode: string;

  @property({
    type: 'string',
    required: true,
  })
  dataElementCode: string;

  @property({
    type: 'string',
  })
  openLMISCode?: string;

  constructor(data?: Partial<Products>) {
    super(data);
  }
}
