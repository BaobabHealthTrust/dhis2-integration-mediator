import { MediatorApplication } from './application';
import { ApplicationConfig } from '@loopback/core';
export { MediatorApplication };
const medUtils = require('openhim-mediator-utils');
const { registerMediator } = require('@kuunika/kupiga');

require('dotenv').config();
const { api, register } = require('config');

import * as mediatorConfig from '../config/mediator.json';

export async function main(options: ApplicationConfig = {}) {
  // TODO: refactor this
  await registerMediator(api, register, mediatorConfig);
  // end
  const app = new MediatorApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}
