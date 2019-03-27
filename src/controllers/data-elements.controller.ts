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

import { inject } from '@loopback/context';
import { Logger } from '../utils';
import { PostObject, Response as PayloadResponse } from '../interfaces';

const uuidv4 = require('uuid/v4');
const Joi = require('joi');
const amqp = require('amqplib/callback_api');

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
  private logger: any;
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

  //TODO: make it into a class check static, some logic be encapsulated in private method
  //TODO: clientId will always be a string
  async checkMigrationReadiness(
    clientId: string | undefined,
    data: PostObject,
    migration: Migration | null,
  ): Promise<void> {
    if (migration) {
      const { values = [] } = data;

      //TODO: find a more expressive name
      let flag: boolean = false;

      //TODO: rename to payload values
      for (const row of values) {
        const { dataElementCode, value, organizationUnitCode, period } = row;

        const where = { dataElementId: dataElementCode };
        const dataElement: DataElement | null = await this.dataElementRepository.findOne(
          { where },
        );

        //TODO: think what to do when data element is null, possibly break 🙃


        if (dataElement) {
          const migrationDataElement: any = {
            organizationUnitCode,
            migrationId: migration.id,
            value,
            dataElementId: dataElement.id,
            isElementAuthorized: true,
            isValueValid: true,
            isProcessed: false,
            isMigrated: false,
            period
          };


          const savedMigrationDataElement = await this.migrationDataElementsRepository.create(
            migrationDataElement,
          );

          if (!savedMigrationDataElement)
            this.logger.info(`element "${
              dataElement.dataElementName
              }" was not uploaded to the database`);
          else
            this.logger.info(`element "${dataElement.dataElementName}" is added successfully to the database`);
        } else {
          flag = true;
          break;
        }
      }
      if (!flag) {
        this.logger.info('Data elements passed validationg')

        migration.elementsAuthorizationAt = new Date(Date.now());
        await this.migrationRepository
          .update(migration)
          .catch(function (err) {
            this.logger.error(err)
          });
        await this.dataElementRepository.pushToMigrationQueue(migration.id, this.channelId);
        this.logger.info('Passing payload to migration queue')
      } else {
        this.logger.info('Data elements failed validationg')
        migration.elementsFailedAuthorizationAt = new Date(Date.now());
        await this.migrationRepository
          .update(migration)
          .catch(function (err) {
            this.logger.error(err)
          });
        this.logger.info('Data elements sending email to client')
        await this.dataElementRepository.pushToEmailQueue(migration.id, 'openmls@gmail.com', flag, this.channelId);
      }
    } else {
      this.logger.info('Invalid migration')
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
  //TODO:  error response
  async create(@requestBody() data: PostObject): Promise<PayloadResponse | Response> {
    const clientId: string | undefined = this.req.get('x-openhim-clientid');
    //TODO: Handle clientId undefined state send but response
    const client: number | undefined = await this.dataElementRepository.getClient(clientId);
    //TODO: handle client undefined and respond fast

    this.logger.info('Validating payload structure')

    const { error } = Joi.validate(data, schema);

    if (error) {
      this.logger.info('Payload structure failed validation, terminating migration')

      const { values = [] } = data;

      await this.migrationRepository.persistError(client, values.length);

      return this.res.status(400).send(error.details[0].message);
    }
    this.logger.info('Payload structure passed validation')

    const migration: Migration | null = await this.migrationRepository.recordStartMigration(client, data.values.length);
    if (!migration) {
      this.logger.info('Could not create migration');
      return this.res.status(500).send('Failed to connect to the Database');
    }
    this.logger.info('Validating data elements')
    this.checkMigrationReadiness(clientId, data, migration);
    this.res.status(202);
    this.logger.info('Sendind feedback on reciept to client');

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
  ): Promise<any> {
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
