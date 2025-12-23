import { HTMLPageSDK } from 'seatable-html-page-sdk';

class Context {

  constructor() {
    this.config = {};
  }

  async init() {
    this.htmlPageSDK = new HTMLPageSDK(this.config);
    await this.htmlPageSDK.init();
  }

  listRows({ tableName, start, limit }) {
    return this.htmlPageSDK.listRows({ tableName, start, limit });
  }

  addRow({ tableName, rowData, rowLinksData }) {
    return this.htmlPageSDK.addRow({ tableName, rowData, rowLinksData });
  }
}

const context = new Context();

export default context;
export { Context };
