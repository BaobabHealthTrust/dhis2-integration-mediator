import { DefaultCrudRepository, juggler, repository } from '@loopback/repository';
import { DataElement, Migration, Client } from '../models';
import { MysqlDataSource } from '../datasources';
import { inject } from '@loopback/core';
import { PostObject } from '../interfaces';
import { Logger } from '../utils/logger';
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
}
