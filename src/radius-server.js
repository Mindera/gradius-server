import radius from 'radius';
import dgram from 'dgram';

class RADIUSServer {

  constructor(secret, protocol, validatePacketCallback) {
    this._secret = secret;
    this._protocol = protocol;
    this._validatePacketCallback = validatePacketCallback;
    this._packetsResponsesInfo = {};

    global.logger.info(`RADIUS Secret: ${secret}`);

    this._setupSocket();
  }

  bind(port, address) {
    this._socket.bind(port, address);
  }

  sendAccessAccept(packet) {
    const code = 'Access-Accept';

    this._sendPacket(code, packet);
  }

  sendAccessReject(packet) {
    const code = 'Access-Reject';

    this._sendPacket(code, packet);
  }

  // Private Methods
  _setupSocket() {
    this._socket = dgram.createSocket(this._protocol);

    this._socket.on('listening', () => {
      const address = this._socket.address();
      global.logger.info(`Server listening ${address.address}:${address.port}`);
    });

    this._socket.on('message', (msg, rinfo) => {
      let decodedPacket;
      try {
        decodedPacket = radius.decode({packet: msg, secret: this._secret});

        this._packetsResponsesInfo[decodedPacket.identifier] = rinfo;
        this._validatePacketCallback(decodedPacket);

      } catch (exception) {
        global.logger.error(`error decoding packet ${exception}`);
      }
    });
  }

  _sendPacket(code, packet) {
    const response = radius.encode_response({
      packet: packet,
      code: code,
      secret: this._secret
    });

    const rinfo = this._packetsResponsesInfo[packet.identifier];

    this._socket.send(response, 0, response.length, rinfo.port, rinfo.address, (error, bytes) => {
      if (error) {
        global.logger.error(`Response not sent with error ${error}`);
      } else {
        global.logger.info(`Sent response with ${bytes}bytes to ${rinfo.address}`);
      }
    });

    delete this._packetsResponsesInfo[packet.identifier];
  }
}

export default RADIUSServer;