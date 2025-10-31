import { chromium, Browser, BrowserContext, Page } from 'playwright';

export class BrowserFactory {
  static async createBrowser(headless: boolean = true): Promise<Browser> {
    return chromium.launch({ headless });
  }

  static async createContext(browser: Browser): Promise<BrowserContext> {
    return browser.newContext();
  }

  static async createPage(context: BrowserContext): Promise<Page> {
    return context.newPage();
  }
}