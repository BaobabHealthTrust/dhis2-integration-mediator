// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { Client } from '@loopback/testlab';
import { MediatorApplication } from '../..';
import { setupApplication } from './test-helper';
const dotenv = require('dotenv');
import { DataElementRepository, ClientRepository } from '../../src/repositories';
import { Logger } from '../../src/utils'
import { PostObject } from '../../src/interfaces';
import { testdb } from '../../src/tests/fixtures/datasources/testdb.datasource';
import { existsSync, unlinkSync } from 'fs';

import {
  expect
} from '@loopback/testlab';
dotenv.config();

describe('data elements', () => {
  let app: MediatorApplication;
  let client: Client;

  let dataElementsRepository: DataElementRepository;
  const channelId = 'test-payload';
  beforeEach(async () => {
    dataElementsRepository = new DataElementRepository(testdb, new ClientRepository(testdb));
  });

  before('setupApplication', async () => {
    ({ app, client } = await setupApplication());
  });

  after(async () => {
    await app.stop();
    setTimeout(() => { process.exit(1) }, 2000)
  });

  it('can write a recieved payload to a file', async () => {
    const logger = new Logger(channelId)
    const data: PostObject = {
      description: 'test-payload',
      values: [
        {
          value: 100,
          dataElementCode: 'de-code',
          organizationUnitCode: 'org-code',
          period: '01011977'
        }
      ]
    }
    const result = await dataElementsRepository.writePayloadToFile(channelId, data, logger);
    expect(result).to.eql(true);
  });
});
