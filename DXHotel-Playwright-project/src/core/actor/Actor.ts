import { Page } from '@playwright/test';
import { Task } from '../interfaces/Task';


export class Actor {
  private page!: Page;

  constructor(public name: string) {}


  async attemptsTo(...tasks: { perform(actor: Actor): Promise<void> }[]): Promise<void> {
    for (const task of tasks) {
      await task.perform(this);
    }
  }


  setPage(page: Page) {
    this.page = page;
  }
  getPage(){
    return this.page;
  }

private memory: Map<string, any> = new Map();

  remember(key: string, value: any): void {
    this.memory.set(key, value);
  }

  recall<T>(key: string): T {
    return this.memory.get(key);
  }


}