const axios = require('axios');
const _ = require('lodash');
require('dotenv').config()

const getOrganisationUnints = async () => {
  console.log(process.env);
  return (axios({
    method: 'get',
    url: `${
      process.env.DHIS2_URL
      }/organisationUnits.json?paging=false&fields=id,name,description,description,coordinates,shortName,phoneNumber,address&level=4`,
    auth: {
      username: process.env.DHIS2_USERNAME,
      password: process.env.DHIS2_PASSWORD
    }
  }).catch((err: Error) => console.log(err.message)));
}

export async function validateOrganizationUnits(ids: string[]) {
  const response = await getOrganisationUnints();
  console.log(`response ${response}`);
  if (response) {
    const orgIds = response.data.organisationUnits.map((org: any) => org.id)
    const inter = _.intersection(ids, orgIds);
    if (inter.length === ids.length) {
      return true
    }
    return false;
  }
  return false;
}
