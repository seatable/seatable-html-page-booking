import { HTMLPageSDK } from 'seatable-html-page-sdk';

const isDev = import.meta.env.DEV;

class Context {

  constructor() {
    this.config = {};
    this.initialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.initialized) return;

    // init sdk
    const sdkOptions = { isMock: isDev, ...this.config };
    this.htmlPageSDK = new HTMLPageSDK(sdkOptions);
    this.initialized = true;
  }

  getAppThemeMode() {
    return this.htmlPageSDK.getAppConfig('app_theme_mode') || 'light';
  }

  async getAppThemeColor(appThemeMode) {
    const app_theme_color = await this.htmlPageSDK.getAppConfig('app_theme_color');
    if (app_theme_color) return app_theme_color;
    if (appThemeMode && appThemeMode === 'dark') {
      return '#1D2838';
    }
    return '#FFFFFF';
  }

  getAppSettings() {
    return this.htmlPageSDK.getAppSettings();
  }

  getAppSetting(key) {
    return this.htmlPageSDK.getAppSetting(key);
  }

  getTables() {
    return this.htmlPageSDK.getTables();
  };

  getRows(tableName, start, limit) {
    return this.htmlPageSDK.getRows(tableName, start, limit);
  }

  addRow(tableName, rowData, linkRows) {
    return this.htmlPageSDK.addRow(tableName, rowData, linkRows);
  }

  subscribeAppChanged(callback) {
    return this.htmlPageSDK.subscribeAppChanged(callback);
  }
}

const context = new Context();

export default context;
export { Context };
