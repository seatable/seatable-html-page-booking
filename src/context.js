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

  addRow({ tableName, rowData }) {
    return this.htmlPageSDK.addRow({ tableName, rowData });
  }
}

const context = new Context();

export default context;
export { Context };
