const log = require('loglevel').getLogger('ScanimageCommand');

const CommandBuilder = require('./command-builder');
const Constants = require('../constants');
const LogFormatter = require('./log-formatter');
const Process = require('./process');
const semver = require('semver');

class Scanimage {

  /**
   * @param {Configuration} config
   */
  constructor(config) {
    this.config = config;
  }

  get version() {
    if (this._version === undefined) {
      const result = Process.executeSync(`${this.config.scanimage} -V`);
      this._version = /.*backend version (.*)/.exec(result)[1];
    }
    return this._version;
  }

  get supportsOutputFlag() {
    return semver.satisfies(this.version, '>=1.0.28');
  }
}

module.exports = class ScanimageCommand {
  constructor(config) {
    this.config = config;
    this.scanimage = new Scanimage(config);
  }

  /**
   * @returns {string}
   */
  devices() {
    return new CommandBuilder(this.config.scanimage)
      .arg('-L')
      .build();
  }

  /**
   * @param {string} deviceId
   * @returns {string}
   */
  features(deviceId) {
    return new CommandBuilder(this.config.scanimage)
      .arg('-d', deviceId)
      .arg('-A')
      .build();
  }

  /**
   * @param {number} page
   * @returns {string}
   */
  filename(page) {
    const number = `000${page}`.slice(-4);
    return `${this.config.tempDirectory}/${Constants.TEMP_FILESTEM}-0-${number}.tif`;
  }

  /**
   * @param {ScanRequest} request
   * @returns {string}
   */
  scan(request) {
    log.debug(LogFormatter.format().full(request));
    const params = request.params;
    const cmdBuilder = new CommandBuilder(this.config.scanimage);
    cmdBuilder.arg('-d', params.deviceId);

    if ('source' in params) {
      cmdBuilder.arg('--source', params.source);
    }
    if ('mode' in params) {
      cmdBuilder.arg('--mode', params.mode);
    }
    if ('gammaCorrection' in params) {
      cmdBuilder.arg('--gamma-correction', params.gammaCorrection);
    }
    if ('colorCorrection' in params) {
      cmdBuilder.arg('--color-correction', params.colorCorrection);
    }
    if ('colorSpace' in params) {
      cmdBuilder.arg('--color-space', params.colorSpace);
    }
    if ('adfMode' in params) {
      cmdBuilder.arg('--adf-mode', params.adfMode);
    }

    cmdBuilder.arg('--resolution', params.resolution);

    if ('pageWidth' in params) {
      cmdBuilder.arg('--page-width', params.pageWidth);
    }
    if ('pageHeight' in params) {
      cmdBuilder.arg('--page-height', params.pageHeight);
    }
    if ('left' in params) {
      cmdBuilder.arg('-l', params.left);
    }
    if ('top' in params) {
      cmdBuilder.arg('-t', params.top);
    }
    if ('width' in params) {
      cmdBuilder.arg('-x', params.width);
    }
    if ('height' in params) {
      cmdBuilder.arg('-y', params.height);
    }

    cmdBuilder.arg('--format', params.format);
    // set neutral calibration to disable the poor defaults
    cmdBuilder.arg('--cct-1', '1'); // red level
    cmdBuilder.arg('--cct-2', '0'); // Adds to red based on green level
    cmdBuilder.arg('--cct-3', '0'); // Adds to red based on blue level
    cmdBuilder.arg('--cct-4', '0'); // Adds to green based on red level
    cmdBuilder.arg('--cct-5', '1'); // green level
    cmdBuilder.arg('--cct-6', '0'); // Adds to green based on blue level
    cmdBuilder.arg('--cct-7', '0'); // Adds to blue based on red level
    cmdBuilder.arg('--cct-8', '0'); // Adds to blue based on green level
    cmdBuilder.arg('--cct-9', '1'); // blue level

    if ('ald' in params) {
      cmdBuilder.arg(`--ald=${params.ald}`);
    }
    if ('depth' in params) {
      cmdBuilder.arg('--depth', params.depth);
    }
    if ('brightness' in params) {
      cmdBuilder.arg('--brightness', params.brightness);
    }
    if ('contrast' in params) {
      cmdBuilder.arg('--contrast', params.contrast);
    }
    if (params.mode === 'Lineart' && params.dynamicLineart === false) {
      cmdBuilder.arg('--disable-dynamic-lineart=yes');
    }
    if ([Constants.BATCH_AUTO, Constants.BATCH_COLLATE_STANDARD, Constants.BATCH_COLLATE_REVERSE].includes(request.batch)) {
      const pattern = `${this.config.tempDirectory}/${Constants.TEMP_FILESTEM}-${request.index}-%04d.tif`;
      cmdBuilder.argPair('--batch', pattern);
    } else {
      const outputFile = 'isPreview' in params && params.isPreview
        ? `${this.config.previewDirectory}/preview.tif`
        : this.filename(request.index);

      if (this.scanimage.supportsOutputFlag) {
        cmdBuilder.arg('-o', outputFile);
      } else {
        cmdBuilder.redirect('>').arg(outputFile);
      }
    }
    return cmdBuilder.build();
  }
};
