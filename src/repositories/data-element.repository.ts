import { DefaultCrudRepository, juggler, repository } from '@loopback/repository';
import { DataElement, Migration, Client } from '../models';
import { MysqlDataSource } from '../datasources';
import { inject } from '@loopback/core';
import { PostObject } from '../interfaces';
import { Logger } from '../utils/logger';
import { writeFileSync } from 'fs';
import {
  ClientRepository,
  MigrationDataElementsRepository,
  MigrationRepository
}
  from '.';

const amqp = require('amqplib/callback_api');

export class DataElementRepository extends DefaultCrudRepository<
  DataElement,
  typeof DataElement.prototype.id
  > {
  constructor(
    @inject('datasources.mysql') dataSource: MysqlDataSource,
    @repository(ClientRepository) protected clientRepository: ClientRepository,
  ) {
    super(DataElement, dataSource);
  }

  async getClient(clientId: string | undefined): Promise<number | undefined> {
    return await this.findClientId(clientId);
  }

  async findClientId(
    clientId: string | undefined,
  ): Promise<number | undefined> {
    const where = { name: clientId };
    const client: Client | null = await this.clientRepository.findOne({ where });
    if (client) return client.id;
    else return undefined;
  }

  pushToMigrationQueue(migrationId: number | undefined, channelId: string, clientId: string, description: string): void {
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
          const message = JSON.stringify({ migrationId, channelId, clientId, description });
          ch.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
          });
          console.log(`Sent ${message}`);

          setTimeout(() => conn.close(), 500);
        });
      },
    );
  }

  pushToValidationQueue(migrationId: number | undefined, channelId: string, clientId: string): void {
    const host = process.env.DIM_VALIDATION_QUEUE_HOST || 'amqp://localhost';
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
            process.env.DIM_VALIDATION_QUEUE_NAME || 'DHIS2_VALIDATION_QUEUE';

          ch.assertQueue(queueName, options);
          const message = JSON.stringify({ migrationId, channelId, clientId });
          ch.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
          });
          setTimeout(() => conn.close(), 500);
        });
      },
    );
  }

  async writePayloadToFile(channelId: string, data: PostObject, logger: Logger): Promise<boolean> {
    try {
      logger.info('writting payload to file')
      await writeFileSync(`data/${channelId}.adx`, JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error('An error occured while saving to the file');
      return false;
    }
  }

  pushToEmailQueue(
    migrationId: number | undefined,
    flag: boolean,
    channelId: string,
    clientId: string,
    description: string
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
          const message = JSON.stringify({ migrationId, flag, source, channelId, clientId, description });
          ch.sendToQueue(queueName, Buffer.from(message), {
            persistent: true,
          });
          console.log(`[x] Sent ${message}`);
          setTimeout(() => conn.close(), 500);
        });
      },
    );
  }
}
