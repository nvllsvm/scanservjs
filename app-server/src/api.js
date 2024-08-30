const log = require('loglevel').getLogger('Api');

const FileInfo = require('./classes/file-info');
const LogFormatter = require('./classes/log-formatter');
const Process = require('./classes/process');
const Request = require('./classes/request');
const ScanController = require('./scan-controller');

const application = require('./application');
const config = application.config();
const scanimageCommand = application.scanimageCommand();

const defaultPreview = FileInfo.create(`${config.previewDirectory}/default.jpg`).toBuffer();

module.exports = new class Api {

  /**
   * @returns {Promise.<FileInfo[]>}
   */
  async fileList() {
    log.trace('fileList()');
    const dir = FileInfo.create(config.outputDirectory);
    let files = await dir.list();
    files = files
      .sort((f1, f2) => f2.lastModified - f1.lastModified);
    log.trace(LogFormatter.format().full(files));
    return files;
  }

  /**
   * @param {string} name
   * @returns {FileInfo}
   */
  fileDelete(name) {
    log.trace('fileDelete()');
    const thumbnail = FileInfo.unsafe(config.thumbnailDirectory, name);
    if (thumbnail.exists()) {
      thumbnail.delete();
    }
    const file = FileInfo.unsafe(config.outputDirectory, name);
    return file.delete();
  }

  /**
   * Runs an action on a file
   * @param {string} actionName
   * @param {string} fileName
   * @returns {Promise.<any>}
   */
  async fileAction(actionName, fileName) {
    const fileInfo = FileInfo.unsafe(config.outputDirectory, fileName);
    if (!fileInfo.exists()) {
      throw new Error(`File '${fileName}' does not exist`);
    }
    await application.userOptions().action(actionName).execute(fileInfo);
  }

  /**
   * @param {ScanRequest} req
   * @returns {Promise<any>}
   */
  async createPreview(req) {
    const context = await application.context();
    const request = new Request(context, {
      params: {
        deviceId: req.params.deviceId,
        mode: req.params.mode,
        source: req.params.source,
        resolution: config.previewResolution,
        brightness: req.params.brightness,
        contrast: req.params.contrast,
        dynamicLineart: req.params.dynamicLineart,
        isPreview: true
      }
    });

    const cmd = `${scanimageCommand.scan(request)}`;
    log.trace('Executing cmd:', cmd);
    await Process.spawn(cmd);
    return {};
  }

  /**
   * @returns {FileInfo}
   */
  deletePreview() {
    log.trace('deletePreview()');
    const file = FileInfo.create(`${config.previewDirectory}/preview.jpg`);
    return file.delete();
  }

  /**
   * @param {string[]} filters
   * @returns {Promise.<Buffer>}
   */
  async readPreview(filters) {
    log.trace('readPreview()', filters);
    // The UI relies on this image being the correct aspect ratio. If there is a
    // preview image then just use it.
    try {
        const buffer = FileInfo.create(`${config.previewDirectory}/preview.jpg`).toBuffer();
        return Promise.resolve(buffer);
    } catch (e) {
        return Promise.resolve(defaultPreview);
    }
  }

  /**
   * @param {string} name
   * @returns {Promise.<Buffer>}
   */
  async readThumbnail(name) {
    const source = FileInfo.unsafe(config.outputDirectory, name);
    if (source.extension !== '.zip') {
      const thumbnail = FileInfo.unsafe(config.thumbnailDirectory, name);
      if (thumbnail.exists()) {
        return thumbnail.toBuffer();
      }
    }
    return [];
  }

  /**
   * @param {ScanRequest} req
   * @returns {ScanResponse}
   */
  async scan(req) {
    return await ScanController.run(req);
  }

  /**
   * @returns {Promise.<Context>}
   */
  async readContext() {
    const context = await application.context();
    log.info(LogFormatter.format().full(context));
    return context;
  }
};
