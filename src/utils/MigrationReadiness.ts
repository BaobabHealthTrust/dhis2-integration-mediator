import { PostObject } from '../interfaces';
import {
  repository
} from '@loopback/repository';
import {
  ClientRepository,
  DataSetRepository,
  DataElementRepository,
  MigrationRepository,
  MigrationDataElementsRepository,
} from '../repositories';
import { Migration, DataElement, MigrationDataElements } from '../models';
import { Logger } from '.';

export class MigrationReadiness {
  private logger: Logger;
  private channelId: string;
  private clientId: string;
  private description: string;
  private migration: Migration;
  constructor(
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
  }

  public async init(
    migration: Migration, channelId: string, logger: Logger, clientId: string, description: string) {
    this.channelId = channelId;
    this.logger = logger;
    this.clientId = clientId;
    this.description = description;
    this.migration = migration;
  }

  private async toMigrationQueue() {
    this.logger.info('Data elements passed validationg')
    this.migration.elementsAuthorizationAt = new Date(Date.now());
    await this.migrationRepository
      .update(this.migration)
      .catch(function (err) {
        this.logger.error(err)
      });
    await this.dataElementRepository.pushToMigrationQueue(this.migration.id, this.channelId, this.clientId, this.description);
    this.logger.info('Passing payload to migration queue')
  }

  private async toEmailQueue(emailFlag: boolean) {
    this.logger.info('Data elements failed validationg')
    this.migration.elementsFailedAuthorizationAt = new Date(Date.now());
    await this.migrationRepository
      .update(this.migration)
      .catch(function (err) {
        this.logger.error(err)
      });
    this.logger.info('Data elements sending email to client')
    await this.dataElementRepository.pushToEmailQueue(
      this.migration.id,
      emailFlag,
      this.channelId,
      this.clientId,
      this.description
    );
  }

  public async checkMigrationReadiness(
    data: PostObject
  ): Promise<void> {
    const payloadValues = data.values;

    let unprocessableDataElementFound: boolean = false;

    for (const payloadValue of payloadValues) {
      const { dataElementCode, value, organizationUnitCode, period } = payloadValue;

      const where = { dataElementId: dataElementCode };
      const dataElement: DataElement | null = await this.dataElementRepository.findOne(
        { where },
      );
      if (dataElement) {
        const migrationDataElement: any = {
          organizationUnitCode,
          migrationId: this.migration.id,
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
          this.logger.info(`element "${dataElement.dataElementName}" was not uploaded to the database`);
        else
          this.logger.info(`element "${dataElement.dataElementName}" is added successfully to the database`);
      } else {
        unprocessableDataElementFound = true;
        break;
      }
    }
    if (!unprocessableDataElementFound) {
      this.toMigrationQueue();
    } else {
      this.toEmailQueue(unprocessableDataElementFound);
    }
  }
}
