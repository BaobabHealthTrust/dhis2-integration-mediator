import {
  expect,
} from '@loopback/testlab';

import { validateOrganizationUnits } from '../../src/utils/index';
import { AssertionError } from 'assert';

describe('Validates organization units', () => {
  // after(async (done) => {
  //   done()
  // });

  it('should make sure organization units posted are valid', async (done) => {
    const sampleOrgnisationUnitIds = ['e1iVoquOKVT', 'E3kLgwow7On'];
    const result = await validateOrganizationUnits(sampleOrgnisationUnitIds)
    expect(result).to.equal(true);
  });
});
