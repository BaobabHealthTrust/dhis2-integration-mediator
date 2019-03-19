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
import { Logger } from '../utils/logger';

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
    //Log only for post requests
    if (req.method.toLocaleLowerCase() === 'post') {
      this.channelId = uuidv4();
      this.logger = new Logger(this.channelId);
    }
  }

  async findClientId(
    clientId: string | undefined,
  ): Promise<number | undefined> {
    const where = { name: clientId };
    const client: Client | null = await this.clientRepository.findOne({ where });
    if (client) return client.id;
    else return undefined;
  }

  pushToMigrationQueue(migrationId: number | undefined, channelId: string): void {
    const host = process.env.DIM_MIGRATION_QUEUE_HOST || 'amqp://localhost';

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
            process.env.DIM_MIGRATION_QUEUE_NAME || 'INTEGRATION_MEDIATOR';

          ch.assertQueue(queueName, options);
          const message = JSON.stringify({ migrationId, channelId });
          ch.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
          });
          console.log(`Sent ${message}`);

          setTimeout(() => conn.close(), 500);
        });
      },
    );
  }

  pushToEmailQueue(
    migrationId: number | undefined,
    email: string,
    flag: boolean,
    channelId: string
  ): void {
    const host = process.env.DIM_EMAIL_QUEUE_HOST || 'amqp://localhost';

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
            process.env.DIM_EMAIL_QUEUE_NAME ||
            'DHIS2_EMAIL_INTEGRATION_QUEUE';

          ch.assertQueue(queueName, options);

          const source = "mediator"
          const message = JSON.stringify({ migrationId, email, flag, source, channelId });
          ch.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
          });
          console.log(`[x] Sent ${message}`);
          setTimeout(() => conn.close(), 500);
        });
      },
    );
  }

  async checkMigrationReadiness(
    clientId: string | undefined,
    data: PostObject,
    migration: Migration | null,
  ): Promise<void> {
    if (migration) {
      const { values = [] } = data;
      let flag: boolean = false;

      for (const row of values) {
        const { dataElementCode, value, organizationUnitCode, period } = row;

        let migrationDataElement: any = {
          organizationUnitCode,
          migrationId: migration.id,
        };

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

          migrationDataElement = await this.migrationDataElementsRepository.create(
            migrationDataElement,
          );

          if (!migrationDataElement)
            this.logger.info(`element "${
              dataElement.dataElementName
              }" was not uploaded to the database`);
          else
            this.logger.info(
              `element "${
              dataElement.dataElementName
              }" is added successfully to the database`,
            );
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
        await this.pushToMigrationQueue(migration.id, this.channelId);
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
        await this.pushToEmailQueue(migration.id, 'openmls@gmail.com', flag, this.channelId);
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
  async create(@requestBody() data: PostObject): Promise<any> {
    //TODO: Could go in the client repository
    const clientId: string | undefined = this.req.get('x-openhim-clientid');
    const client: number | undefined = await this.findClientId(clientId);

    this.logger.info('Validating payload structure')

    const { error } = Joi.validate(data, schema);

    if (error) {
      this.logger.info('Payload structure failed validation, terminating migration')

      const { values = [] } = data;
      //TODO: could go into repo, requiring client and number of elements  i.e persistError()
      await this.migrationRepository.create({
        clientId: client,
        structureFailedValidationAt: new Date(Date.now()),
        valuesFailedValidationAt: new Date(Date.now()),
        elementsFailedAuthorizationAt: new Date(Date.now()),
        uploadedAt: new Date(Date.now()),
        totalDataElements: values.length,
      });

      // await console.log(error.details[0].message);
      return this.res.status(400).send(error.details[0].message);
    }
    this.logger.info('Payload structure passed validation')

    const date: Date = new Date(Date.now());

    // TODO: could go in repo and be startMigration()
    const migration: Migration | null = await this.migrationRepository.create({
      clientId: client,
      structureValidatedAt: date,
      valuesValidatedAt: date,
      uploadedAt: date,
      totalDataElements: data.values.length,
    });

    this.logger.info('Validating data elements')

    //TODO: rename function to checkMigrationReadiness()  in repo
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

    const client: number | undefined = await this.findClientId(clientId);
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
