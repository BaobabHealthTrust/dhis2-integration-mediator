import {repository, Filter, ArrayType} from '@loopback/repository';
import {
  ClientRepository,
  DataSetRepository,
  DataElementRepository,
} from '../repositories';
import {Client, DataSet, DataElement} from '../models';

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

import {inject} from '@loopback/context';

const Joi = require('joi');

export class DataElementsController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
  ) {}

  @post('/dhis2/data-elements', {
    responses: {
      '200': {
        description: 'Post data element values',
        content: {'application/json': {schema: {'x-ts-type': ArrayType}}},
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

    const {error} = Joi.validate(obj, schema);
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
}
