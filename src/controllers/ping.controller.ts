import {
  Request,
  RestBindings,
  Response,
  get,
  ResponseObject,
} from '@loopback/rest';
import {inject} from '@loopback/context';

const {
  buildOrchestration,
  buildReturnObject,
} = require('@kuunika/openhim-util');

/**
 * OpenAPI response for ping()
 */
const PING_RESPONSE: ResponseObject = {
  description: 'Ping Response',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          greeting: {type: 'string'},
          date: {type: 'string'},
          url: {type: 'string'},
          headers: {
            type: 'object',
            properties: {
              'Content-Type': {type: 'string'},
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
};

/**
 * A simple controller to bounce back http requests
 */
export class PingController {
  constructor(
    @inject(RestBindings.Http.REQUEST) private req: Request,
    @inject(RestBindings.Http.RESPONSE) private res: Response,
  ) {}

  // Map to `GET /ping`
  @get('/ping', {
    responses: {
      '200': PING_RESPONSE,
    },
  })
  ping(): object {
    // Reply with a greeting, the current time, the url, and request headers
    return {
      greeting: 'Hello from LoopBack',
      date: new Date(),
      url: this.req.url,
      headers: Object.assign({}, this.req.headers),
    };
  }

  @get('/ping/hello')
  hello(): any {
    const orchestrations: Array<object> = [];

    const properties: object = {property: 'Primary Route'};

    const clientId: string | undefined = this.req.get('x-openhim-clientid');

    this.res.set('Content-Type', 'application/json+openhim');

    return this.res.send(
      buildReturnObject(
        'urn',
        'Successful',
        200,
        {},
        JSON.stringify('Heloo'),
        orchestrations,
        properties,
        this.req,
      ),
    );
  }
}
