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
  createStubInstance,
  expect,
  sinon,
  StubbedInstanceWithSinonAccessor,
} from '@loopback/testlab';
dotenv.config();

describe('data elements', () => {
  let app: MediatorApplication;
  let client: Client;

  let dataElementsRepository: DataElementRepository;
  const channelId = 'test-payload';
  const payLoadFilePath = `./../../../data/${channelId}.adx`;
  beforeEach(async () => {
    dataElementsRepository = new DataElementRepository(testdb, new ClientRepository(testdb));
  });

  before('setupApplication', async () => {
    ({ app, client } = await setupApplication());
  });

  after(async () => {
    await app.stop();
    try {
      unlinkSync(payLoadFilePath);
    } catch (err) {
      console.log(err.message);
    }
    setTimeout(() => { process.exit(1) }, 2000)
  });

  it('should recieve a payload with the right structure', async () => {
    const samplePayload = {
      description: "Sample payload",
      values: [
        {
          dataElementCode: "123xyz",
          value: 12,
          organizationUnitCode: "xyz123",
          period: "201012"
        }
      ]
    }
    await client
      .post('/dhis2/data-elements')
      .set('x-openhim-clientid', process.env.API_TEST_CLIENT || '')
      .send(samplePayload)
      .expect(202)
      .expect('Content-Type', /application\/json/);
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
    // expect(existsSync(payLoadFilePath)).to.eql(true)
  });
});
