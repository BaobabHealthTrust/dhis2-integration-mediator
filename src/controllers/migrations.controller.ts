import {
  get,
  param,
  HttpErrors
} from '@loopback/rest';
import { repository } from '@loopback/repository';
import { MigrationRepository, ClientRepository } from '../repositories';

export class MigrationsController {
  constructor(
    @repository(MigrationRepository)
    protected migrationRepository: MigrationRepository,
    @repository(ClientRepository)
    protected clientRepository: ClientRepository,
  ) { }

  @get('/dhis2/migration-metadata/{channelId}', {
    responses: {
      '200': {
        description: 'Get migration metadata given a channelId',
        content: {
          'application/json': {},
        },
      },
    },
  })
  async metadata(
    @param.path.string('channelId') channelId: string = ''
  ): Promise<any> {
    if (!channelId) {
      throw new HttpErrors.UnprocessableEntity('Channel Id is required');
    }
    const migration = await this.migrationRepository.findOne({ where: { channelId } });
    if (migration) {
      const client = await this.clientRepository.findOne({ where: { id: migration.clientId } });
      if (client) {
        const { createdAt } = migration;
        const { email, name } = client;
        return {
          startTime: createdAt,
          clientEmail: email,
          clientName: name
        };
      }
      return {}
    }
    return {};
  }
}
