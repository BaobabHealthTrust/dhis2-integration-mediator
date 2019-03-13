import * as winston from 'winston';
import * as Pusher from 'pusher';

const { createLogger, format, transports } = winston;

class Logger {
  private _pusherLogger: Pusher;
  private _logger: any;
  private channelId: string = "dhis2-integration-channelId";
  constructor(private realChannelId: string) {
    this._logger = createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json()
      ),
      defaultMeta: { service: 'DHIS2-integration-mediator' },
      transports: [
        new transports.File({ filename: `./logs/${this.channelId}-error.log`, level: 'error' }),
        new transports.File({ filename: `./logs/${this.channelId}-combined.log` })
      ]
    });
    if (process.env.NODE_ENV !== 'production') {
      this._logger.add(new transports.Console({
        format: format.combine(
          format.colorize(),
          format.simple()
        )
      }));
    }
    this._pusherLogger = new Pusher({
      appId: process.env.DIM_PUSHER_APP_ID || '',
      key: process.env.DIM_PUSHER_KEY || '',
      secret: process.env.DIM_PUSHER_SECRET || '',
      cluster: process.env.DIM_PUSHER_CLUSTER || '',
      encrypted: Boolean(process.env.DIM_PUSHER_ENCRYPTED) || true
    });
  }
  public info(message: string) {
    this._logger.info(message)
    this._pusherLogger.trigger(this.channelId, 'my-event', message);
  }

  public error(message: string) {
    this._logger.error(message)
  }
}

export { Logger };
