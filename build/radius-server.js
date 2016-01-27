'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _radius = require('radius');

var _radius2 = _interopRequireDefault(_radius);

var _dgram = require('dgram');

var _dgram2 = _interopRequireDefault(_dgram);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var RADIUSServer = function () {
  function RADIUSServer(secret, protocol, validatePacketCallback) {
    _classCallCheck(this, RADIUSServer);

    this._secret = secret;
    this._protocol = protocol;
    this._validatePacketCallback = validatePacketCallback;
    this._packetsResponsesInfo = {};

    global.logger.info('RADIUS Secret: ' + secret);

    this._setupSocket();
  }

  _createClass(RADIUSServer, [{
    key: 'bind',
    value: function bind(port, address) {
      this._socket.bind(port, address);
    }
  }, {
    key: 'sendAccessAccept',
    value: function sendAccessAccept(packet) {
      var code = 'Access-Accept';

      this._sendPacket(code, packet);
    }
  }, {
    key: 'sendAccessReject',
    value: function sendAccessReject(packet) {
      var code = 'Access-Reject';

      this._sendPacket(code, packet);
    }

    // Private Methods

  }, {
    key: '_setupSocket',
    value: function _setupSocket() {
      var _this = this;

      this._socket = _dgram2.default.createSocket(this._protocol);

      this._socket.on('listening', function () {
        var address = _this._socket.address();
        global.logger.info('Server listening ' + address.address + ':' + address.port);
      });

      this._socket.on('message', function (msg, rinfo) {
        var decodedPacket = undefined;
        try {
          decodedPacket = _radius2.default.decode({ packet: msg, secret: _this._secret });

          _this._packetsResponsesInfo[decodedPacket.identifier] = rinfo;
          _this._validatePacketCallback(decodedPacket);
        } catch (exception) {
          global.logger.error('error decoding packet ' + exception);
        }
      });
    }
  }, {
    key: '_sendPacket',
    value: function _sendPacket(code, packet) {
      var response = _radius2.default.encode_response({
        packet: packet,
        code: code,
        secret: this._secret
      });

      var rinfo = this._packetsResponsesInfo[packet.identifier];

      this._socket.send(response, 0, response.length, rinfo.port, rinfo.address, function (error, bytes) {
        if (error) {
          global.logger.error('Response not sent with error ' + error);
        } else {
          global.logger.info('Sent response with ' + bytes + 'bytes to ' + rinfo.address);
        }
      });

      delete this._packetsResponsesInfo[packet.identifier];
    }
  }]);

  return RADIUSServer;
}();

exports.default = RADIUSServer;