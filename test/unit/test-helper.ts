import { MediatorApplication } from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';

export async function setupApplication(): Promise<AppWithClient> {
  const app = new MediatorApplication({
    rest: {
      port: process.env.PORT || 3000,
      host: process.env.HOST || '0.0.0.0',
    }
  });

  await app.boot();
  await app.start();

  const client = createRestAppClient(app);

  return { app, client };
}

export interface AppWithClient {
  app: MediatorApplication;
  client: Client;
}
