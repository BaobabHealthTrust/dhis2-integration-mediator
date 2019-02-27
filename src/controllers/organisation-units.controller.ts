import {
  Request,
  RestBindings,
  Response,
  get,
  ResponseObject,
  param,
  RawBodyParser
} from '@loopback/rest';
import { inject } from '@loopback/context';

const axios = require('axios');

const {
  buildOrchestration,
  buildReturnObject,
} = require('@kuunika/openhim-util');

export class OrganisationUnitsController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
  ) { }

  @get('/dhis2/organisation-units', {
    responses: {
      '200': {
        description: 'Get all organisation units from dhis',
        content: {
          'application/json': {},
        },
      },
    },
  })
  //TODO: narrow down based on search param
  async organisationUnits(
    @param.query.string('name') name = '',
  ): Promise<any> {
    const response = await axios({
      url: `${
        process.env.DHIS2_URL
        }/organisationUnits.json?paging=false&fields=id,name,description,description,coordinates,shortName,phoneNumber,address&level=4`,
      method: 'get',
      withCredentials: true,
      auth: {
        username: `${process.env.DHIS2_USERNAME}`,
        password: `${process.env.DHIS2_PASSWORD}`,
      },
    });

    const rawOrganisationUnits = response.data.organisationUnits.filter((organisationUnit: any) => (
      organisationUnit.name.toLowerCase().includes(name.toLowerCase())
    ));

    const organisationUnits = {
      resourceType: 'Bundle',
      type: 'collection',
      timestamp: Date.now(),
      total: rawOrganisationUnits.length,
      entry: rawOrganisationUnits.map((rawOrganisationUnit: any) => {

        //TODO: install babel optiona chaining to refactor this code
        //const coordinates = orgunits?.cordinates.slice(1,-1).split(',) || ['0','0']
        //conts [lat, long] = coordinates
        let [latitude, longitude] = [0, 0];
        if (rawOrganisationUnit.coordinates) {
          [latitude, longitude] = rawOrganisationUnit.coordinates
            .slice(1, -1)
            .split(',');
        }

        return {
          fullUrl: process.env.DHIS2_URL,
          resource: {
            resourceType: 'Location',
            identifier: [
              {
                value: rawOrganisationUnit.id,
              },
            ],
            name: rawOrganisationUnit.name,
            alias: [rawOrganisationUnit.shortName || rawOrganisationUnit.name],
            telecom: [
              {
                system: 'phonenumber',
                value: rawOrganisationUnit.phoneNumber || null,
              },
            ],
            address: {
              line: [rawOrganisationUnit.address],
            },
            position: {
              latitude,
              longitude,
            },
          },
        };
      }),
    };

    this.res.set('Content-Type', 'application/json');
    return this.res.json(organisationUnits);
  }
}
