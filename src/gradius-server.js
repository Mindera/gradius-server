import konfig from 'konfig';
import GoogleUserValidator from './google-user-validator';
import RadiusServer from './radius-server';
import process from 'process';
import winston from 'winston';
import NPID from 'npid';

const argv = require('yargs')
  .usage('Usage: $0 --pidfile <pid_file> --logfile <log_file>')
  .demand(['pidfile', 'logfile'])
  .string('pidfile')
  .string('logfile')
  .argv;

const logger = new winston.Logger({
  transports: [
    new winston.transports.File({
      timestamp: true,
      filename: argv.logfile,
      json: false
    })
  ]
});
global.logger = logger;

const pid = process.pid;
let npid;
try {
    npid = NPID.create(argv.pidfile);
    npid.removeOnExit();
} catch (error) {
    console.error(error);
    process.exit(1);
}

logger.info(`========================= Starting Google Radius Server with PID: ${pid} =========================`);

process.on('SIGTERM', terminate);
process.on('SIGINT', terminate);
process.on('SIGHUP', terminate);

function terminate() {
  npid.remove();
  
  logger.info(`========================= Stoping Google Radius Server with PID: ${pid} ==========================`);

  process.exit(0);
}

const configs = konfig();

const accountValidator = new GoogleUserValidator(configs.smtp, configs.app.domain);
const radiusServer = new RadiusServer(configs.app.secret, configs.app.protocol, validateReceivedPacket);

function validateReceivedPacket(packet) {

  const username = packet.attributes['User-Name'];
  const password = packet.attributes['User-Password'];

  accountValidator.validate(username, password, (success) => {
    logger.info(`validated? ${success}`);

    if (success) {
      radiusServer.sendAccessAcept(packet);
    } else {
      radiusServer.sendAccessReject(packet);
    }
  });  
}

radiusServer.bind(configs.app.port, configs.app.address);

