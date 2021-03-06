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
      return this.res.status(503).send('Interoperability layer client missing from request');
    }
    const writtenToFile = await this.dataElementRepository.writePayloadToFile(this.channelId, data, this.logger);
    if (!writtenToFile) {
      this.logger.info('failed to save payload to file')
      return this.res.status(503).send('Failed to save your payload to file');
    }
    await this.dataElementRepository.pushToValidationQueue(this.channelId, clientId);
    this.res.status(202);
    this.logger.info('Sending feedback on reciept to client');
    return {
      message: 'Payload recieved successfully',
      notificationsChannel: this.channelId,
    };
  }
}
