// Copyright IBM Corp. 2018. All Rights Reserved.
// Node module: @loopback/example-shopping
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

import { Client } from '@loopback/testlab';
import { MediatorApplication } from '../..';
import { setupApplication } from './test-helper';

describe('data elements controller', () => {
  let app: MediatorApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({ app, client } = await setupApplication());
  });

  after(async () => {
    await app.stop();
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
      .send(samplePayload)
      .expect(202)
      .expect('Content-Type', /application\/json/);
  });
});
