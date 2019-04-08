import {
  repository,
  ArrayType,
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
} from '../models';

import {
  get,
  post,
  Request,
  RestBindings,
  Response,
  requestBody,
  param,
} from '@loopback/rest';

import { writeFileSync } from 'fs';

import { inject } from '@loopback/context';
import { Logger, MigrationReadiness } from '../utils';
import { PostObject, Response as PayloadResponse } from '../interfaces';

const uuidv4 = require('uuid/v4');
const Joi = require('joi');

const schema: object = Joi.object().keys({
  description: Joi.string()
    .min(3)
    .required(),
  values: Joi.array()
    .items(
      Joi.object()
        .keys({
          value: Joi.number().required(),
          dataElementCode: Joi.string().required(),
          organizationUnitCode: Joi.string().required(),
          period: Joi.string().required(),
        })
        .required(),
    )
    .required(),
});

export class DataElementsController {
  private logger: Logger;
  private channelId: string;
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
  ) {
    if (req.method.toLocaleLowerCase() === 'post') {
      this.channelId = uuidv4();
      this.logger = new Logger(this.channelId);
    }
  }

  private async writePayloadToFile(data: PostObject): Promise<boolean> {
    this.logger.info('writting payload to file')
    await writeFileSync(`data/${this.channelId}.adx`, JSON.stringify(data));
    return true;
  }

  @post('/dhis2/data-elements', {
    responses: {
      '200': {
        description: 'Post data element values',
        content: { 'application/json': { schema: { 'x-ts-type': ArrayType } } },
      },
    },
  })

  async create(@requestBody() data: PostObject): Promise<PayloadResponse | Response> {
    const clientId: string | undefined = this.req.get('x-openhim-clientid');
    if (!clientId) {
      return this.res.status(400).send('Interoperability layer client missing from request');
    }
    const client: number | undefined = await this.dataElementRepository.getClient(clientId);
    if (!client) {
      return this.res.status(400).send('Could not find client from the database');
    }
    const migration: Migration | null = await this.migrationRepository.recordStartMigration(client, data.values.length);
    if (!migration) {
      this.logger.info('Could not create migration');
      return this.res.status(500).send('Failed to connect to the Database');
    }
    await this.dataElementRepository.writePayloadToFile(this.channelId, data, this.logger);
    this.res.status(202);
    this.logger.info('Sending feedback on reciept to client');
    return {
      message: 'Payload recieved successfully',
      notificationsChannel: this.channelId,
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
  ): Promise<Response> {
    const clientId: string | undefined = this.req.get('x-openhim-clientid');

    let dataElements: Array<DataElement> = [];

    const client: number | undefined = await this.dataElementRepository.findClientId(clientId);
    if (client) {
      const dataSet: DataSet | null = await this.dataSetRepository.findOne({
        where: { clientId: client },
      });
      if (dataSet) {
        const where = new WhereBuilder().eq('dataSetId', dataSet.id).build();

        //TODO: filter by name or code
        dataElements = await this.dataElementRepository.find({
          where: {
            ...where,
            dataElementName: { like: `%${name}%` },
          },
          skip,
          limit,
        });
      }
    } else {
      this.res.status(400).send('Interoperability client not found')
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
}
