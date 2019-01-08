import { MediatorApplication } from './application';
import { ApplicationConfig } from '@loopback/core';
import { format } from 'url';
export { MediatorApplication };
const medUtils = require('openhim-mediator-utils');

require('dotenv').config()
const { api, register } = require('config');
import * as mediatorConfig from '../config/mediator.json'

export async function main(options: ApplicationConfig = {}) {

  // TODO: refactor this
  await registerMediator()
  // end

  const app = new MediatorApplication(options);
  await app.boot();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}

const registerMediator = () => {
  const { trustSelfSigned, heartbeat } = api

  console.log(api, mediatorConfig)

  if (trustSelfSigned) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  }

  if (register) {
    medUtils.registerMediator(api, mediatorConfig, (err: any) => {
      if (err) {
        console.log('Failed to register this mediator, check your config')
        console.log(err.stack)
        process.exit(1)
      }

      api.urn = mediatorConfig.urn
      medUtils.fetchConfig(api, (err: any, config: any) => {
        console.log('Received initial config:')
        console.log(JSON.stringify(config))

        if (err) {
          console.log('Failed to fetch initial config')
          console.log(err.stack)
          process.exit(1)
        } else {
          console.log('Successfully registered mediator!')
          if (heartbeat) {
            let configEmitter = medUtils.activateHeartbeat(api)
            configEmitter.on('config', (config: any) => {
              console.log('Received updated config:')
              console.log(JSON.stringify(config))
              console.log(config)
            })
          }
        }
      })
    })
  }
}
