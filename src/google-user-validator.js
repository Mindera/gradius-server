import SMTPConnection from 'smtp-connection';

class GoogleUserValidator {

  constructor(options, domain) {
    this._options = options;
    this._domain = domain;
  }

  // Public Methods
  validate(username, password, callback) {
    const smtpConnection = this._setupSMTPConnection();

    smtpConnection.connect(() => {
      const auth = {
        user: `${username}@${this._domain}`,
        pass: password
      };

      smtpConnection.login(auth, (error) => {
        if (error) {
          global.logger.error(`Failed to login to SMTP server with error: ${error}`);
        }

        callback(!!!error);

        smtpConnection.quit();
      });
    });
  }

  // Private Methods
  _setupSMTPConnection() {
    const smtpConnection = new SMTPConnection(this._options);

    smtpConnection.on('connect', () => {
      global.logger.info(`Connection established with SMTP server`);
    });

    smtpConnection.on('error', (error) => {
      global.logger.error(`SMTP server throw error: ${error}`);
    });

    smtpConnection.on('end', () => {
      global.logger.info(`Connection closed with SMTP server`);
    });

    return smtpConnection;
  }
}

export default GoogleUserValidator;