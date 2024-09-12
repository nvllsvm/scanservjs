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
    let proc = await Process.spawn(scanimageCommand.scan(this.request));
    let info = JSON.parse(proc.toString());
    log.info(info);
    return info;
  }

  /**
   * @param {ScanRequest} req
   * @returns {Promise.<ScanResponse>}
   */
  async execute(req) {
    await this.init(req);

    await this.deleteFiles();

    let info = await this.scan();

    await this.deleteFiles();

    const fileInfo = FileInfo.create(info.scanPath);
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
