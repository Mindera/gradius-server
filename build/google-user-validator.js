'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _smtpConnection = require('smtp-connection');

var _smtpConnection2 = _interopRequireDefault(_smtpConnection);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GoogleUserValidator = function () {
  function GoogleUserValidator(options, domain) {
    _classCallCheck(this, GoogleUserValidator);

    this._options = options;
    this._domain = domain;
  }

  // Public Methods

  _createClass(GoogleUserValidator, [{
    key: 'validate',
    value: function validate(username, password, callback) {
      var _this = this;

      var smtpConnection = this._setupSMTPConnection();

      smtpConnection.connect(function () {
        var auth = {
          user: username + '@' + _this._domain,
          pass: password
        };

        smtpConnection.login(auth, function (error) {
          if (error) {
            global.logger.error('Failed to login to SMTP server with error: ' + error);
          }

          callback(!!!error);

          smtpConnection.quit();
        });
      });
    }

    // Private Methods

  }, {
    key: '_setupSMTPConnection',
    value: function _setupSMTPConnection() {
      var smtpConnection = new _smtpConnection2.default(this._options);

      smtpConnection.on('connect', function () {
        global.logger.info('Connection established with SMTP server');
      });

      smtpConnection.on('error', function (error) {
        global.logger.error('SMTP server throw error: ' + error);
      });

      smtpConnection.on('end', function () {
        global.logger.info('Connection closed with SMTP server');
      });

      return smtpConnection;
    }
  }]);

  return GoogleUserValidator;
}();

exports.default = GoogleUserValidator;