"use strict";
exports.__esModule = true;
var winston = require("winston");
var Pusher = require("pusher");
var createLogger = winston.createLogger, format = winston.format, transports = winston.transports;
var Logger = /** @class */ (function () {
    function Logger(realChannelId) {
        this.realChannelId = realChannelId;
        this.channelId = "dhis2-integration-channelId";
        this._logger = createLogger({
            level: 'info',
            format: format.combine(format.timestamp({
                format: 'YYYY-MM-DD HH:mm:ss'
            }), format.errors({ stack: true }), format.splat(), format.json()),
            defaultMeta: { service: 'DHIS2-integration-mediator' },
            transports: [
                new transports.File({ filename: "./logs/" + this.channelId + "-error.log", level: 'error' }),
                new transports.File({ filename: "./logs/" + this.channelId + "-combined.log" })
            ]
        });
        if (process.env.NODE_ENV !== 'production') {
            this._logger.add(new transports.Console({
                format: format.combine(format.colorize(), format.simple())
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
    Logger.prototype.info = function (message) {
        this._logger.info(message);
        this._pusherLogger.trigger(this.channelId, 'my-event', message);
    };
    Logger.prototype.error = function (message) {
        this._logger.error(message);
    };
    return Logger;
}());
exports.Logger = Logger;
