import { expect, Client } from '@loopback/testlab';
import { config } from 'dotenv';
import { MediatorApplication } from '..';
import { setupApplication } from './unit/test-helper';
import axios from 'axios';
import { MigrationRepository, MigrationDataElementsRepository } from '../src/repositories';

// import { testdb } from '../src/tests/fixtures/datasources/testdb.datasource';

describe('End to end', () => {
  const data = {
    "description": "Test Migration",
    "reporting-period": "201810",
    "facilities": [
      {
        "facility-code": "LL4048",
        "values": [
          {
            "product-code": "AA039600-d",
            "value": 100
          }
        ]
      }
    ]
  }

  const auth = {
    password: 'openlmis',
    username: 'openlmis',
  };

  const url = `http://127.0.0.1:5001/dhis2/data-elements`;
  const method = 'POST';

  const options: object = { auth, data, method, url };

  let app: MediatorApplication;
  let migrationRepository: MigrationRepository;
  let migrationDataElementsRepository: MigrationDataElementsRepository;
  let client: Client;


  before('setupApplication', async () => {
    config({ path: '../.env' });
    ({ app, client } = await setupApplication());
    migrationRepository = await app.getRepository(MigrationRepository);
    migrationDataElementsRepository = await app.getRepository(MigrationDataElementsRepository);
  });

  after(async () => {
    await app.stop();
    setTimeout(() => { process.exit(1) }, 2000)
  });

  it('should send payload to dhis2', async () => {
    const result: any = await axios(options).catch((err: Error) => console.log(err.message));
    await setTimeout(async () => {
      const migration = await migrationRepository.findOne({
        order: ["id DESC"],
        limit: 1,
      })

      if (!migration) {
        console.log('migration not found');
        return
      }

      const migrationDataElements = await migrationDataElementsRepository.find({
        where: { migrationId: migration.id }
      })

      if (!migrationDataElements) {
        console.log('migration data elements not found');
        return
      }

      const [dataElement] = migrationDataElements
      let dhis2Url = 'http://dhistest.kuunika.org:1414/dhis/api/dataValues.json?'
      dhis2Url += `de=${dataElement.dataElementCode}`
      dhis2Url += `&pe=${dataElement.reportingPeriod}`
      dhis2Url += `&ou=${dataElement.organizationUnitCode}`

      const dhis2Auth = {
        password: String(process.env.DHIS2_PASSWORD),
        username: String(process.env.DHIS2_USERNAME),
      }

      // tslint:disable-next-line: no-any
      const res: any = await axios({
        auth: dhis2Auth,
        method: 'GET',
        url: dhis2Url
      }).catch((err: Error) => console.log(err.message));

      if (!res) {
        console.log('error in querying DHIS2');
        return;
      }

      const [resValue] = res.data
      expect(Number(resValue)).to.equal(data.facilities[0].values[0].value)
      expect(result.data.message).to.equal('Payload recieved successfully')
    }, 1200)
  });
});
