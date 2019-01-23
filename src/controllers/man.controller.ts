import {
  Count,
  CountSchema,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getFilterSchemaFor,
  getWhereSchemaFor,
  patch,
  put,
  del,
  requestBody,
} from '@loopback/rest';
import {MigrationDataElements} from '../models';
import {MigrationDataElementsRepository} from '../repositories';

export class ManController {
  constructor(
    @repository(MigrationDataElementsRepository)
    public migrationDataElementsRepository : MigrationDataElementsRepository,
  ) {}

  @post('/migration-data-elements', {
    responses: {
      '200': {
        description: 'MigrationDataElements model instance',
        content: {'application/json': {schema: {'x-ts-type': MigrationDataElements}}},
      },
    },
  })
  async create(@requestBody() migrationDataElements: MigrationDataElements): Promise<MigrationDataElements> {
    return await this.migrationDataElementsRepository.create(migrationDataElements);
  }

  @get('/migration-data-elements/count', {
    responses: {
      '200': {
        description: 'MigrationDataElements model count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async count(
    @param.query.object('where', getWhereSchemaFor(MigrationDataElements)) where?: Where,
  ): Promise<Count> {
    return await this.migrationDataElementsRepository.count(where);
  }

  @get('/migration-data-elements', {
    responses: {
      '200': {
        description: 'Array of MigrationDataElements model instances',
        content: {
          'application/json': {
            schema: {type: 'array', items: {'x-ts-type': MigrationDataElements}},
          },
        },
      },
    },
  })
  async find(
    @param.query.object('filter', getFilterSchemaFor(MigrationDataElements)) filter?: Filter,
  ): Promise<MigrationDataElements[]> {
    return await this.migrationDataElementsRepository.find(filter);
  }

  @patch('/migration-data-elements', {
    responses: {
      '200': {
        description: 'MigrationDataElements PATCH success count',
        content: {'application/json': {schema: CountSchema}},
      },
    },
  })
  async updateAll(
    @requestBody() migrationDataElements: MigrationDataElements,
    @param.query.object('where', getWhereSchemaFor(MigrationDataElements)) where?: Where,
  ): Promise<Count> {
    return await this.migrationDataElementsRepository.updateAll(migrationDataElements, where);
  }

  @get('/migration-data-elements/{id}', {
    responses: {
      '200': {
        description: 'MigrationDataElements model instance',
        content: {'application/json': {schema: {'x-ts-type': MigrationDataElements}}},
      },
    },
  })
  async findById(@param.path.number('id') id: number): Promise<MigrationDataElements> {
    return await this.migrationDataElementsRepository.findById(id);
  }

  @patch('/migration-data-elements/{id}', {
    responses: {
      '204': {
        description: 'MigrationDataElements PATCH success',
      },
    },
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody() migrationDataElements: MigrationDataElements,
  ): Promise<void> {
    await this.migrationDataElementsRepository.updateById(id, migrationDataElements);
  }

  @put('/migration-data-elements/{id}', {
    responses: {
      '204': {
        description: 'MigrationDataElements PUT success',
      },
    },
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() migrationDataElements: MigrationDataElements,
  ): Promise<void> {
    await this.migrationDataElementsRepository.replaceById(id, migrationDataElements);
  }

  @del('/migration-data-elements/{id}', {
    responses: {
      '204': {
        description: 'MigrationDataElements DELETE success',
      },
    },
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.migrationDataElementsRepository.deleteById(id);
  }
}
