const log = require('loglevel').getLogger('ScanController');
const Constants = require('./constants');
const CommandBuilder = require('./classes/command-builder');
const FileInfo = require('./classes/file-info');
const Process = require('./classes/process');
const Request = require('./classes/request');

const application = require('./application');
const userOptions = application.userOptions();
const config = application.config();
const scanimageCommand = application.scanimageCommand();

class ScanController {
  constructor() {
    /** @type {Context} */
    this.context = null;

    /** @type {ScanRequest} */
    this.request = null;

    this.dir = FileInfo.create(config.tempDirectory);
  }

  /**
   * @param {ScanRequest} req
   */
  async init(req) {
    this.context = await application.context();
    this.request = new Request(this.context, req);
    this.pipeline = config.pipelines
      .filter(p => p.description === this.request.pipeline)[0];
    if (this.pipeline === undefined) {
      throw Error('No matching pipeline');
    }
    switch (this.request.pipeline) {
        case 'JPG':
            this.request.params.format = 'jpeg'
            break;
        case 'PNG':
            this.request.params.format = 'png'
            break;
        case 'TIF':
            this.request.params.format = 'tiff'
            break;
        default:
            throw Error('No matching format');
    }
  }

  /**
   * @returns {Promise.<FileInfo[]>}
   */
  async listFiles() {
    const files = await this.dir.list();
    return files.sort((f1, f2) => f1.name.localeCompare(f2.name));
  }

  /**
   * @returns {Promise.<void>}
   */
  async deleteFiles() {
    (await this.listFiles()).map(f => f.delete());
  }

  /**
   * @returns {Promise.<void>}
   */
  async scan() {
    log.info('Scanning');
    await Process.spawn(scanimageCommand.scan(this.request));
  }

  /**
   * @param {ScanRequest} req
   * @returns {Promise.<ScanResponse>}
   */
  async execute(req) {
    await this.init(req);

    await this.deleteFiles();

    await this.scan();

    let files = await this.listFiles();
    let filename = files[0].name;
    const destination = `${config.outputDirectory}/${filename}`;

    await this.deleteFiles();

    const fileInfo = FileInfo.create(destination);
    return { fileInfo };
  }
}

module.exports = {
  /**
   * @param {ScanRequest} req
   * @returns {Promise.<ScanResponse>}
   */
  async run(req) {
    const scan = new ScanController();
    return await scan.execute(req);
  }
};
