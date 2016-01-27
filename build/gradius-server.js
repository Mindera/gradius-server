'use strict';

var _konfig = require('konfig');

var _konfig2 = _interopRequireDefault(_konfig);

var _googleUserValidator = require('./google-user-validator');

var _googleUserValidator2 = _interopRequireDefault(_googleUserValidator);

var _radiusServer = require('./radius-server');

var _radiusServer2 = _interopRequireDefault(_radiusServer);

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _npid = require('npid');

var _npid2 = _interopRequireDefault(_npid);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argv = require('yargs').usage('Usage: $0 --pidfile <pid_file> --logfile <log_file>').demand(['pidfile', 'logfile']).string('pidfile').string('logfile').argv;

var logger = new _winston2.default.Logger({
  transports: [new _winston2.default.transports.File({
    timestamp: true,
    filename: argv.logfile,
    json: false
  })]
});
global.logger = logger;

var pid = _process2.default.pid;
var npid = undefined;
try {
  npid = _npid2.default.create(argv.pidfile);
  npid.removeOnExit();
} catch (error) {
  console.error(error);
  _process2.default.exit(1);
}

logger.info('======================= Starting Google Radius Server with PID: ' + pid + ' =======================');

_process2.default.on('SIGTERM', terminate);
_process2.default.on('SIGINT', terminate);
_process2.default.on('SIGHUP', terminate);

function terminate() {
  npid.remove();

  logger.info('======================= Stoping Google Radius Server with PID: ' + pid + ' =======================');

  _process2.default.exit(0);
}

var configs = (0, _konfig2.default)();

var accountValidator = new _googleUserValidator2.default(configs.smtp, configs.app.domain);
var radiusServer = new _radiusServer2.default(configs.app.secret, configs.app.protocol, validateReceivedPacket);

function validateReceivedPacket(packet) {

  var username = packet.attributes['User-Name'];
  var password = packet.attributes['User-Password'];

  accountValidator.validate(username, password, function (success) {
    logger.info('validated? ' + success);

    if (success) {
      radiusServer.sendAccessAcept(packet);
    } else {
      radiusServer.sendAccessReject(packet);
    }
  });
}

radiusServer.bind(configs.app.port, configs.app.address);