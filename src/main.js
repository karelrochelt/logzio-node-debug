const debug = require('debug')
const logzIo = require('logzio-nodejs')
const stringifyObject = require('stringify-object')
const continuationStorage = require('continuation-local-storage');
const getNamespace = continuationStorage.getNamespace
const createNamespace = continuationStorage.createNamespace
const myRequest = createNamespace('request');
const requestIdMiddleware = require('./request-id.middleware')

class LogzDebug {

  constructor() {
    this.logzLogger = {
      log() {
        // do nothing if logzio not initialized. Useful for tests.
      }
    }
  }

  init(logzOptions) {
    this.logzLogger = logzIo.createLogger(logzOptions)
  }

  requestIdMiddleware(req, res, next) {
    requestIdMiddleware(req, res, next)
  }

  debug(namespace) {
    const logLevel = namespace.endsWith(':error') ? 'error' : 'debug'
    const debugLogger = debug(namespace)

    return (...args) => {
      const requestNamespace = getNamespace('request');
      const requestId = requestNamespace.get('id')

      // const loggedMethodName = logger.caller ? logger.caller.name : 'UNKNOWN'
      debugLogger(...args)

      const stringifiedArgs = args.map(arg => {
        const coercedArg = debug.coerce(arg)
        if (typeof coercedArg === 'string') return coercedArg

        return stringifyObject(coercedArg)
          .replace(/\s+/g, ' ')
      })

      this.logzLogger.log({
        level: logLevel,
        requestId,
        message: [namespace, ...stringifiedArgs]
      })
    }
  }
}

module.exports = new LogzDebug()
