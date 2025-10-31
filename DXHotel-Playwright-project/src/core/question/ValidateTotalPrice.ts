import { Page, expect } from '@playwright/test';
import { Actor } from '@core/actor/Actor';
import { DateUtils } from '@utils/DateUtils';

export class ValidateTotalPrice {
  static isCorrect(): ValidateTotalPrice {
    return new ValidateTotalPrice();
  }
  
  async answeredBy(actor: Actor, page: Page): Promise<void> {
    const cheapestPrice = actor.recall<number>('cheapestPrice');
    const checkInDate = actor.recall<string>('checkInDate');
    const checkOutDate = actor.recall<string>('checkOutDate');

    const nights = DateUtils.calculateNights(checkInDate, checkOutDate);
    const expectedTotal = cheapestPrice * nights;

    console.log('Esperando que la página termine de cargar...');

    console.log('Esperando el precio total...');
    
    await page.locator("tr.price-result td.price").waitFor({ state: 'visible' });
    const totalPriceLocator = page.locator("//tr[@class='price-result']//td[@class='price']");
    const totalPriceText = await totalPriceLocator.innerText();
    const actualTotal = parseFloat(totalPriceText.replace(/[^0-9.]/g, ''));

    console.log(`Esperado: ${expectedTotal}, Actual: ${actualTotal}`);
    expect(actualTotal).toBe(expectedTotal);
  }
}
