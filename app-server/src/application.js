const Config = require('./classes/config');
const Context = require('./classes/context');
const DeviceIdParser = require('./classes/device-id-parser');
const Device = require('./classes/device');
const Feature = require('./classes/feature');
const FileInfo = require('./classes/file-info');
const UserOptions = require('./classes/user-options');

const device_string = "\nAll options specific to device `EpsonPerfectionV600':\n    --mode Binary|Gray|Color [Color]\n        Selects the scan mode (e.g., lineart, monochrome, or color).\n    --depth 8|16 [8]\n        Number of bits per sample, typical values are 1 for \"line-art\" and 8\n        for multibit scans.\n    --halftoning None|Halftone A (Hard Tone)|Halftone B (Soft Tone)|Halftone C (Net Screen) [inactive]\n        Selects the halftone.\n    --dropout None|Red|Green|Blue [inactive]\n        Selects the dropout.\n    --sharpness -2..2 [inactive]\n        \n    --gamma-correction User defined (Gamma=1.0)|User defined (Gamma=1.8) [User defined (Gamma=1.8)]\n        Selects the gamma correction value from a list of pre-defined devices\n        or the user defined table, which can be downloaded to the scanner\n    --color-correction User defined [inactive]\n        Sets the color correction table for the selected output device.\n    --resolution 200|400|800|1600|3200|6400dpi [400]\n        Sets the resolution of the scanned image.\n    --x-resolution 200|400|600|800|1200|1600|3200|6400dpi [200] [advanced]\n        Sets the horizontal resolution of the scanned image.\n    --y-resolution 200|240|320|400|600|800|1200|1600|3200|4800|6400dpi [320] [advanced]\n        Sets the vertical resolution of the scanned image.\n    --threshold 0..255 [inactive]\n        Select minimum-brightness to get a white point\n    --mirror[=(yes|no)] [inactive]\n        Mirror the image.\n    --speed[=(yes|no)] [no]\n        Determines the speed at which the scan proceeds.\n    --auto-area-segmentation[=(yes|no)] [inactive]\n        \n    --short-resolution[=(yes|no)] [no]\n        Display short resolution list\n    --zoom 50..200 [inactive]\n        Defines the zoom factor the scanner will use\n    --red-gamma-table 0..255,...\n        Gamma-correction table for the red band.\n    --green-gamma-table 0..255,...\n        Gamma-correction table for the green band.\n    --blue-gamma-table 0..255,...\n        Gamma-correction table for the blue band.\n    --wait-for-button[=(yes|no)] [no] [advanced]\n        After sending the scan command, wait until the button on the scanner\n        is pressed to actually start the scan process.\n    --monitor-button[=(yes|no)] [no] [read-only]\n        Indicates whether a button on the scanner has been pressed.\n    --polling-time <int> [1000000] [read-only]\n        Time between queries when waiting for device state changes.\n    --needs-polling[=(yes|no)] [no] [read-only]\n        Indicates whether the scanner needs to poll.\n    --preview[=(yes|no)] [no]\n        Request a preview-quality scan.\n    --preview-speed[=(yes|no)] [no]\n        \n    --scan-area Maximum|A4|A5 Landscape|A5 Portrait|B5|Letter|Executive|CD [Maximum]\n        Select an area to scan based on well-known media sizes.\n    -l 0..215.9mm [0]\n        Top-left x position of scan area.\n    -t 0..297.18mm [0]\n        Top-left y position of scan area.\n    -x 0..215.9mm [215.9]\n        Width of scan-area.\n    -y 0..297.18mm [297.18]\n        Height of scan-area.\n    --quick-format Maximum|A4|A5 Landscape|A5 Portrait|B5|Letter|Executive|CD [Maximum]\n        Select an area to scan based on well-known media sizes. (DEPRECATED)\n    --format jpeg|jpeg-xl|png|ppm|tiff [tiff]\n        Selects the output format.\n        --source Flatbed|Transparency Unit [Flatbed]\n        Selects the scan source (such as a document-feeder).\n    --auto-eject[=(yes|no)] [inactive]\n        Eject document after scanning\n    --film-type Positive Film|Negative Film [inactive]\n        \n    --focus-position Focus on glass|Focus 2.5mm above glass [inactive]\n        Sets the focus position to either the glass or 2.5mm above the glass\n    --bay  1 | 2 | 3 | 4 | 5 | 6  [inactive]\n        Select bay to scan\n    --eject [inactive]\n        Eject the sheet in the ADF\n    --adf-mode Simplex|Duplex [inactive]\n        Selects the ADF mode (simplex/duplex)\n    --detect-doc-size[=(yes|no)] [inactive]\n        Activates document size auto-detection.  The scan area will be set to\n        match the detected document size.\n    --scan-area-is-valid[=(yes|no)] [yes] [read-only]\n        Indicates whether the current scan area settings are valid.\n    --adf-auto-scan[=(yes|no)] [inactive]\n        Skips per sheet device setup for faster throughput.\n    --double-feed-detection-sensitivity None|Low|High [inactive]\n        Sets the sensitivity with which multi-sheet page feeds are detected\n        and reported as errors.\n    --ext-sane-status 0..2 [0] [read-only]\n        Ugly kludge to provide additional status message strings to a\n        frontend.\n    --adf-duplex-direction-matches[=(yes|no)] [inactive]\n        Indicates whether the device's ADF duplex mode, if available, scans in\n        the same direction for the front and back.\n    --deskew[=(yes|no)] [inactive]\n        Rotate image so it appears upright.\n    --autocrop[=(yes|no)] [inactive]\n        Determines empty margins in the scanned image and removes them.  This\n        normally reduces the image to the size of the original document but may\n        remove more.\n    --calibrate [inactive]\n        Performs color matching to make sure that the document's color tones\n        are scanned correctly.\n    --clean [inactive]\n        Cleans the scanners reading section.\n\n";

module.exports = new class Application {
  constructor() {
    this._log = null;
    this._userOptions = null;
    /** @type {Configuration} */
    this._config = null;
    /** @type {ScanimageCommand} */
    this._scanimageCommand = null;
  }

  log() {
    if (this._log === null) {
      this._log = require('loglevel').getLogger('Application');
    }
    return this._log;
  }

  userOptions() {
    if (this._userOptions === null) {
      this._userOptions = new UserOptions('../../config/config.local.js');
    }
    return this._userOptions;
  }

  /**
   * @returns {Configuration}
   */
  config() {
    if (this._config === null) {
      this._config = new Config(this.userOptions());
    }
    return this._config;
  }

  scanimageCommand() {
    if (this._scanimageCommand === null) {
      const ScanimageCommand = require('./classes/scanimage-command');
      this._scanimageCommand = new ScanimageCommand(this.config());
    }
    return this._scanimageCommand;
  }

  /**
   * Attempts to get a stored configuration of our devices and if
   * not gets it from the command line.
   * @returns {Promise.<ScanDevice[]>}
   */
  async deviceList() {
    const Process = require('./classes/process');
    const config = this.config();
    const scanimageCommand = this.scanimageCommand();
    let device = Device.from(device_string);

    device.features['--format'] = Feature.parse('--format jpeg|jpeg-xl|png|ppm|tiff [tiff]');
    device.features['--format'].default = 'tiff'
    device.features['--format'].options = ['jpeg', 'jpeg-xl', 'png', 'ppm', 'tiff'];

    device.features['--gamma-correction'].default = '2.2'                                                                                                                                                                                                                      
    device.features['--gamma-correction'].options = ['1.0', '1.8', '2.0', '2.2', '2.4', '2.8']

    device.features['--color-correction'] = Feature.parse('--color-correction[=(yes|no)] [yes]');

    device.features['--color-space'] = Feature.parse('--color-space None|A|B [None]');
    device.features['--color-space'].default = 'sRGB IEC61966-2.1';
    device.features['--color-space'].options = [
        'None',
        'Adobe RGB (1998)',
        'EPSON sRGB',                                                                                                                                                                                                                                                          
        'sRGB IEC61966-2.1'                                                                                                                                                                                                                                                    
     ];

    let devices = [];
    devices.push(device);
    return devices;
  }

  /**
   * @returns {Promise.<Context>}
   */
  async context() {
    const devices = await this.deviceList();
    return new Context(this.config(), devices, this.userOptions());
  }
};
