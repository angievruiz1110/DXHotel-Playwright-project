import { Page } from '@playwright/test';
import { Actor } from '@core/actor/Actor';
export interface Task {
  perform(actor: Actor, page?: Page): Promise<void>;
}
