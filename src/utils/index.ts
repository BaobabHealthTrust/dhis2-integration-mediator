import { Logger } from './logger';
const axios = require('axios');

export async function validateOrganizationUnits(payload: any[]) {
  const dhis2OrgUnits = await axios({
    method: 'get',
    url: `${
      process.env.DHIS2_URL
      }/organisationUnits.json?paging=false&fields=id,name,description,description,coordinates,shortName,phoneNumber,address&level=4`,
    auth: {
      username: process.env.DHIS2_USERNAME,
      password: process.env.DHIS2_PASSWORD
    }
  });
}
