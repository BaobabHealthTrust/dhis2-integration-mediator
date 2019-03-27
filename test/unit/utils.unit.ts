import {
  expect,
} from '@loopback/testlab';

import { validateOrganizationUnits } from '../../src/utils/index';

describe('Validates organization units', () => {
  afterEach(async () => {
    setTimeout(function () {
      process.exit(1);
    }, 2000);
  });

  it('should make sure organization units posted are valid', async () => {
    const sampleOrgnisationUnitIds = ['e1iVoquOKVT', 'E3kLgwow7On'];
    const result = await validateOrganizationUnits(sampleOrgnisationUnitIds)
    expect(result).to.equal(true);
  });
});
