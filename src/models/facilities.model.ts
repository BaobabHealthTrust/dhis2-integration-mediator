import {Entity, model, property} from '@loopback/repository';

@model()
export class Facilities extends Entity {
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
  facilityCode: string;

  @property({
    type: 'string',
  })
  DHIS2OrganizationalUnitCode?: string;

  @property({
    type: 'string',
  })
  openLMISFaciliyCode?: string;

  constructor(data?: Partial<Facilities>) {
    super(data);
  }
}
