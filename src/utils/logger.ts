import * as winston from 'winston';

const { createLogger, format, transports } = winston;

class Logger {
  private _logger: any;
  constructor(private channelId: string) {
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
        new transports.File({ filename: `./logs/${channelId}-error.log`, level: 'error' }),
        new transports.File({ filename: `./logs/${channelId}-combined.log` })
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
  }
  public info(message: string) {
    this._logger.info(message)
  }

  public error(message: string) {
    this._logger.error(message)
  }
}

export { Logger };
