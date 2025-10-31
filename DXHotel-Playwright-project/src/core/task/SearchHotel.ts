import { Task } from '@interfaces/Task';
import { SELECTORS } from '@utils/formSearch';
import { Actor } from '@core/actor/Actor';

export class SearchHotel implements Task {
  private checkInDate: string;
  private checkOutDate: string;
  private rooms: string;
  private adults: string;
  private childrens: string;

  constructor(checkInDate: string, checkOutDate: string, rooms: string, adults: string, childrens: string) {
    this.checkInDate = checkInDate;
    this.checkOutDate = checkOutDate;
    this.rooms = rooms;
    this.adults = adults;
    this.childrens = childrens;
  }

  static for(checkInDate: string, checkOutDate: string, rooms: string, adults: string, childrens: string): SearchHotel {
    return new SearchHotel(checkInDate, checkOutDate, rooms, adults, childrens);
  }

  async perform(actor: Actor): Promise<void> {
    const page = actor.getPage();
    if (!page) throw new Error('Page no inicializada');

    await page.click(SELECTORS.locationInput);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');

    const checkInInput = page.locator(SELECTORS.checkIn);
    await checkInInput.waitFor();

    const checkOutInput = page.locator(SELECTORS.checkOut);
    await checkOutInput.waitFor();

    await checkInInput.fill(this.checkInDate);
    await checkOutInput.fill(this.checkOutDate);

    await checkInInput.evaluate((el: HTMLInputElement) => el.dispatchEvent(new Event('change', { bubbles: true })));
    await checkOutInput.evaluate((el: HTMLInputElement) => el.dispatchEvent(new Event('change', { bubbles: true })));

    await page.fill(SELECTORS.rooms, this.rooms);
    await page.fill(SELECTORS.adults, this.adults);
    await page.fill(SELECTORS.children, this.childrens);

    const searchButton = page.locator(SELECTORS.searchButton);
    await searchButton.click();

    await page.waitForSelector(SELECTORS.priceSlider);

    await page.evaluate(() => {
      const priceControl = (window as any).ASPxClientControl.GetControlCollection().GetByName('MainContentPlaceHolder_FilterFormLayout_NightlyRateTrackBar');
      if (priceControl) {
        priceControl.SetValue([200, priceControl.GetValue()[1]]);
      } else {
        console.error('Control de precio no encontrado');
      }
    });

    await page.click(SELECTORS.rating1);
    await page.click(SELECTORS.rating2);
    await page.click(SELECTORS.filterCell);

    await page.waitForSelector(SELECTORS.hotelListLoaded, { timeout: 60000 });

    const pagination = page.locator(SELECTORS.pagination);
    const totalPages = await pagination.count();

    let allPrices: { price: number; pageIndex: number; hotelIndex: number }[] = [];

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      const priceLocators = page.locator(SELECTORS.hotelPrice);
      const count = await priceLocators.count();

      for (let i = 0; i < count; i++) {
        const priceText = await priceLocators.nth(i).innerText();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        allPrices.push({ price, pageIndex: pageIndex + 1, hotelIndex: i });
      }

      if (pageIndex < totalPages - 1) {
        const nextButton = page.locator(SELECTORS.nextButton);
        const currentPageText = await page.locator(SELECTORS.currentPage).innerText();

        await nextButton.click();

        await page.waitForSelector(`${SELECTORS.currentPage}:text-is("${parseInt(currentPageText) + 1}")`, { timeout: 60000 });
      }
    }

    console.log(`Total precios encontrados: ${allPrices.length}`);
    console.log('Precios:', allPrices);

    if (allPrices.length === 0) {
      console.error('No se encontraron precios.');
      return;
    }

    const cheapestHotel = allPrices.reduce((min, hotel) => hotel.price < min.price ? hotel : min, allPrices[0]);
    console.log(`Hotel más barato: Precio = ${cheapestHotel.price}, Página = ${cheapestHotel.pageIndex}, Índice = ${cheapestHotel.hotelIndex}`);

    const currentPageText = await page.locator(SELECTORS.currentPage).innerText();
    const currentPage = parseInt(currentPageText);

    if (currentPage !== cheapestHotel.pageIndex) {
      console.log(`Navegando a la página ${cheapestHotel.pageIndex}...`);
      const targetPageButton = page.locator(SELECTORS.pagination).nth(cheapestHotel.pageIndex - 1);
      await Promise.all([
        targetPageButton.click(),
        page.waitForSelector(`${SELECTORS.currentPage}:text-is("${cheapestHotel.pageIndex}")`, { timeout: 60000 })
      ]);
    }

    const hotelLocator = page.locator(SELECTORS.hotelCell).nth(cheapestHotel.hotelIndex);
    const bookButton = hotelLocator.locator(SELECTORS.bookButton);
    await bookButton.click();

    await Promise.all([
      page.waitForLoadState('domcontentloaded'),
      page.waitForLoadState('networkidle')
    ]);

    console.log(`Hotel más barato seleccionado: Precio = ${cheapestHotel.price}`);

    actor.remember('cheapestPrice', cheapestHotel.price);
    actor.remember('checkInDate', this.checkInDate);
    actor.remember('checkOutDate', this.checkOutDate);
  }
}