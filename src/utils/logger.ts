const amqp = require('amqplib/callback_api');
const Tortoise = require('tortoise');
export class Logger {
  constructor(private channelId: string) { }

  private async _pushToLogQueue(message: string) {
    const host = process.env.DIM_LOG_QUEUE_HOST || 'amqp://localhost';
    const tortoise = new Tortoise(host);
    const service = 'mediator';
    const queueName = process.env.DIM_LOG_QUEUE_NAME || 'ADX_LOG_WORKER';
    const { channelId } = this;
    tortoise
      .queue(queueName, { durable: true })
      .publish({ message: JSON.stringify({ message, service }), channelId });
  }

  async error(message: string) {
    this._pushToLogQueue(message);
  }

  async info(message: string) {
    this._pushToLogQueue(message);
  }
}
