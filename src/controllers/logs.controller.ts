import { inject } from '@loopback/context';
import {
  get,
  param,
} from '@loopback/rest';
import * as redis from 'redis';
const asyncRedis = require('async-redis');
import { RedisClient } from 'redis';
import { promisify } from 'util';

export class LogsController {
  private redisClient: RedisClient;
  constructor() {
    this.redisClient = redis.createClient(
      {
        host: process.env.DIM_REDIS_HOST,
        port: Number(process.env.DIM_REDIS_HOST)
      }
    );
  }

  @get('/dhis2/logs', {
    responses: {
      '200': {
        description: 'Get all logs given a channelId',
        content: {
          'application/json': {},
        },
      },
    },
  })
  async logs(
    @param.query.string('channelId') channelId = ''
  ): Promise<any[]> {
    const start = 0;
    const end = -1;
    const lrangeAsync = promisify(this.redisClient.lrange).bind(this.redisClient);
    const values = await lrangeAsync(channelId, start, end);
    const jsonValues = values.map(value => JSON.parse(value));
    return jsonValues;
  }
}
