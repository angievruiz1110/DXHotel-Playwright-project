import { Task } from '@interfaces/Task';
import { BrowserFactory } from '../../infraestructure/playwright/BrowserFactory';
import { Browser, Page } from 'playwright';

export class OpenBrowser implements Task {
  private url: string;
  private browser?: Browser;
  private page?: Page;

  constructor(url: string) {
    this.url = url;
  }

  static at(url: string): OpenBrowser {
    return new OpenBrowser(url);
  }

  async perform(): Promise<void> {
    this.browser = await BrowserFactory.createBrowser(false);
    const context = await BrowserFactory.createContext(this.browser);
    this.page = await BrowserFactory.createPage(context);
    await this.page.goto(this.url);
  }

  getPage(): Page | undefined {
    return this.page;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}