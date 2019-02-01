import {
  repository,
  Filter,
  ArrayType,
  Where,
  WhereBuilder,
} from '@loopback/repository';
import {
  ClientRepository,
  DataSetRepository,
  DataElementRepository,
  MigrationRepository,
  MigrationDataElementsRepository,
} from '../repositories';

import {
  Client,
  DataSet,
  DataElement,
  Migration,
  MigrationDataElements,
} from '../models';

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

import { inject } from '@loopback/context';

const Joi = require('joi');
const amqp = require('amqplib/callback_api');
const { buildReturnObject } = require('@kuunika/openhim-util');

interface DataElementValue {
  value: number;
  dataElementCode: string;
  organizationUnitCode: string;
  period: string;
}
interface PostObject {
  description: string;
  values: Array<DataElementValue>;
}

export class DataElementsController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
    @repository(ClientRepository) protected clientRepository: ClientRepository,
    @repository(DataSetRepository)
    protected dataSetRepository: DataSetRepository,
    @repository(DataElementRepository)
    protected dataElementRepository: DataElementRepository,
    @repository(MigrationRepository)
    protected migrationRepository: MigrationRepository,
    @repository(MigrationDataElementsRepository)
    protected migrationDataElementsRepository: MigrationDataElementsRepository,
  ) { }

  async findClientId(
    clientId: string | undefined,
  ): Promise<number | undefined> {
    const where = { name: clientId };
    const client: Client | null = await this.clientRepository.findOne({ where });
    if (client) return client.id;
    else return undefined;
  }

  pushToQueue(migrationId: number | undefined): void {
    const host = process.env.DIM_QUEUE_HOST || 'amqp://localhost';
    amqp.connect(
      host,
      function (err: any, conn: any): void {
        if (err) console.log(err);
        conn.createChannel(function (err: any, ch: any) {
          if (err) console.log(err);

          const options = {
            durable: true,
          };

          const queueName =
            process.env.DIM_QUEUE_NAME || 'INTEGRATION_MEDIATOR';

          ch.assertQueue(queueName, options);
          const message = JSON.stringify({ migrationId });
          ch.sendToQueue(queueName, new Buffer(message), { persistent: true });
          console.log(`[x] Sent ${message}`);
          setTimeout(() => conn.close(), 500);
        });
      },
    );
  }

  async authenticate(
    clientId: string | undefined,
    data: PostObject,
  ): Promise<void> {
    const client: number | undefined = await this.findClientId(clientId);

    const { values } = data;

    const migration: Migration | null = await this.migrationRepository.create({
      clientId: client,
    });

    const elementsFailedAuthorization: DataElementValue[] = [];

    for (const row of values) {
      ///  update firebase on status
      const { dataElementCode, value, organizationUnitCode, period } = row;
      let migrationDataElement: any = {
        organizationUnitCode,
      };

      if (migration) {
        migrationDataElement.migrationId = migration.id;
      }

      migrationDataElement.value = value;

      const where = { dataElementId: dataElementCode };

      const dataElement: DataElement | null = await this.dataElementRepository.findOne(
        { where },
      );

      if (dataElement) {
        migrationDataElement.dataElementId = dataElement.id;
        migrationDataElement.isElementAuthorized = true;
        migrationDataElement.isValueValid = true;
        migrationDataElement.isProcessed = false;
        migrationDataElement.isMigrated = false;
        migrationDataElement.period = period;
        await this.migrationDataElementsRepository.create(migrationDataElement);
      } else {
        elementsFailedAuthorization.push(row);
        // TODO: terminate if element is not authorized
      }
      console.log(elementsFailedAuthorization);
    }

    // for  email unauthorized elements
    // trigger queue
    if (migration) {
      await this.pushToQueue(migration.id);
    }
  }

  @post('/dhis2/data-elements', {
    responses: {
      '200': {
        description: 'Post data element values',
        content: { 'application/json': { schema: { 'x-ts-type': ArrayType } } },
      },
    },
  })
  async create(@requestBody() data: PostObject): Promise<any> {
    const schema: object = Joi.object().keys({
      description: Joi.string()
        .min(3)
        .required(),
      values: Joi.array().items(
        Joi.object().keys({
          value: Joi.number().required(),
          dataElementCode: Joi.string().required(),
          organizationUnitCode: Joi.string().required(),
          period: Joi.string().required(),
        }),
      ),
    });

    const { error } = Joi.validate(data, schema);

    if (error) {
      const errorMessage = error.details[0].message;
      await console.log(errorMessage);
      return this.res.status(400).send(errorMessage);
    }

    const clientId: string | undefined = this.req.get('x-openhim-clientid');
    this.authenticate(clientId, data);

    this.res.status(202);

    // add channel here

    return {
      message: 'Payload recieved successfully',
      notificationsChannel: 'rb34512',
    };
  }

  @get('/dhis2/data-elements', {
    responses: {
      '200': {
        description: 'Get data elements for a specific client',
        content: {
          'application/json': {},
        },
      },
    },
  })
  async find(
    @param.query.number('limit') limit = 0,
    @param.query.number('skip') skip = 0,
    @param.query.string('name') name = '',
  ): Promise<any> {
    const orchestrations: Array<object> = [];

    const properties: object = { property: 'Primary Route' };

    const clientId: string | undefined = this.req.get('x-openhim-clientid');

    let dataElements: Array<DataElement> = [];

    const client: number | undefined = await this.findClientId(clientId);
    if (client) {
      const dataSet: DataSet | null = await this.dataSetRepository.findOne({
        where: { clientId: client },
      });
      if (dataSet) {
        //TODO: Query not being processed
        const where = new WhereBuilder().eq('dataSetId', dataSet.id).build();
        dataElements = await this.dataElementRepository.find({
          where: {
            ...where,
            dataElementName: { like: `%${name}%` },
          },
          skip,
          limit,
        });
      }
    }

    this.res.set('Content-Type', 'application/json');

    const returnObject = {
      resourceType: 'ValueSet',
      expansion: {
        total: dataElements.length,
        offset: skip,
        contains: dataElements.map(dataElement => ({
          stystem: `${process.env.DHIS2_URL}`,
          code: dataElement.dataElementId,
          display: dataElement.dataElementName,
        })),
      },
    };

    return this.res.json(returnObject);
  }

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
  async organisationUnits(): Promise<any> {
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

    const rawOrganisationUnits = response.data.organisationUnits;

    const organisationUnits = {
      resourceType: 'Location',
      code: 'string',
      timestamp: Date.now(),
      total: rawOrganisationUnits.length,
      link: [
        {
          relation: 'string',
          url: 'string',
        },
      ],
      entry: rawOrganisationUnits.map((rawOrganisationUnit: any) => {
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
            operationalStatus: {
              system: 'dhis2',
              code: 'code',
              display: 'display',
            },
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
