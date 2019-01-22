import { repository, Filter, ArrayType } from '@loopback/repository';
import {
  ClientRepository,
  DataSetRepository,
  DataElementRepository,
} from '../repositories';
import { Client, DataSet, DataElement } from '../models';

const axios = require('axios');

import {
  get,
  post,
  Request,
  RestBindings,
  Response,
  requestBody,
  getFilterSchemaFor,
  param,
  ResponseObject,
} from '@loopback/rest';

const {
  buildReturnObject,
} = require('@kuunika/openhim-util');

import { inject } from '@loopback/context';

const Joi = require('joi');

export class DataElementsController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
    @repository(ClientRepository) protected clientRepository: ClientRepository,
    @repository(DataSetRepository) protected dataSetRepository: DataSetRepository,
    @repository(DataElementRepository) protected dataElementRepository: DataElementRepository,
  ) { }

  @post('/lb4/data-elements', {
    responses: {
      '200': {
        description: 'Post data element values',
        content: { 'application/json': { schema: { 'x-ts-type': ArrayType } } },
      },
    },
  })
  async create(@requestBody() obj: object): Promise<any> {
    const schema: object = Joi.object().keys({
      effectiveDate: Joi.string()
        .min(3)
        .required(),
      description: Joi.string()
        .min(3)
        .required(),
      values: Joi.array().items(
        Joi.object().keys({
          code: Joi.string().required(),
          total: Joi.number().required(),
        }),
      ),
    });

    const { error } = Joi.validate(obj, schema);
    if (error) {
      const errorMessage = error.details[0].message;
      await console.log(errorMessage);
      return this.res.status(400).send(errorMessage);
    }

    console.log(obj);

    this.res.status(202);
    return {
      message: 'Payload recieved successfully',
      notificationsChannel: 'rb34512',
    };
  }

  @get('/lb4/data-elements', {
    responses: {
      '200': {
        description: 'Get data elements for a specific client',
        content: {
          'application/json': {
          },
        },
      },
    },
  })
  async find(
  ): Promise<any> {
    const orchestrations: Array<object> = [];

    const properties: object = { property: 'Primary Route' };

    const clientId: string | undefined = this.req.get('x-openhim-clientid');

    let dataElements: Array<DataElement> = [];

    const client: Client | null = await this.clientRepository.findOne({ where: { name: clientId } })
    if (client) {
      const dataSet: DataSet | null = await this.dataSetRepository.findOne({ where: { clientId: client.id } })
      if (dataSet) {
        dataElements = await this.dataElementRepository.find({ where: { dataSetId: dataSet.id } })
      }
    }

    this.res.set('Content-Type', 'application/json');

    const returnObject = {
      "resourceType": "ValueSet",
      "expansion": {
        "total": dataElements.length,
        "offset": 0,
        "contains": dataElements.map(dataElement => ({
          stystem: `${process.env.DHIS2_URL}`,
          code: dataElement.dataElementId,
          display: dataElement.dataElementName
        }))
      }
    }

    return this.res.json(
      returnObject
      // buildReturnObject(
      //   'urn',
      //   'Successful',
      //   200,
      //   {},
      //   JSON.stringify(returnObject),
      //   orchestrations,
      //   properties,
      //   this.req,
      // ),
    );
  }

  @get('/lb4/organisation-units', {
    responses: {
      '200': {
        description: 'Get all organisation units from dhis',
        content: {
          'application/json': {
          },
        },
      },
    },
  })
  async organisationUnits(
  ): Promise<any> {
    const orchestrations: Array<object> = [];

    const properties: object = { property: 'Primary Route' };

    const clientId: string | undefined = this.req.get('x-openhim-clientid');

    // console.log(process.env);

    const response = await axios({
      url: `${process.env.DHIS2_URL}/organisationUnits.json?fields=id,name,description,level,description,coordinates,shortName,phoneNumber,address`,
      method: 'get',
      withCredentials: true,
      auth: {
        username: `${process.env.DHIS2_USERNAME}`,
        password: `${process.env.DHIS2_PASSWORD}`
      }
    });

    const rawOrganisationUnits = response.data.organisationUnits;

    const organisationUnits = {
      resourceType: "Location",
      code: "string",
      timestamp: Date.now(),
      total: rawOrganisationUnits.length,
      link: [
        {
          "relation": "string",
          "url": "string"
        }
      ],
      entry: rawOrganisationUnits.map((rawOrganisationUnit: any) => {
        let [latitude, longitude] = [0, 0];
        if (rawOrganisationUnit.coordinates) {
          [latitude, longitude] = (rawOrganisationUnit.coordinates.slice(1, -1)).split(',');
        }

        return {
          fullUrl: process.env.DHIS2_URL,
          resource: {
            resourceType: "Location",
            identifier: [
              {
                value: rawOrganisationUnit.id
              }
            ],
            name: rawOrganisationUnit.name,
            alias: [
              rawOrganisationUnit.shortName || rawOrganisationUnit.name,
            ],
            operationalStatus: {
              system: "dhis2",
              code: "code",
              display: "display"
            },
            telecom: [
              {
                system: "phonenumber",
                value: rawOrganisationUnit.phoneNumber || null
              }
            ],
            address: {
              line: [
                rawOrganisationUnit.address
              ]
            },
            position: {
              latitude,
              longitude
            }
          }
        }
      })
    }

    this.res.set('Content-Type', 'application/json');

    return this.res.json(
      organisationUnits
      // buildReturnObject(
      //   'urn',
      //   'Successful',
      //   200,
      //   {},
      //   JSON.stringify({ organisationUnits }),
      //   orchestrations,
      //   { ...properties },
      //   this.req,
      // ),
    );
  }
}
