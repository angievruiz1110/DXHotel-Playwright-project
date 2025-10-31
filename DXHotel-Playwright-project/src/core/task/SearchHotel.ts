import { Task } from '@interfaces/Task'
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


    const checkInInput = page.locator('#MainContentPlaceHolder_SearchPanel_SearchPanelLayout_CheckInDateEdit_I');
    await checkInInput.waitFor();

    const checkOutInput = page.locator('#MainContentPlaceHolder_SearchPanel_SearchPanelLayout_CheckOutDateEdit_I');
    await checkOutInput.waitFor();

    await checkInInput.fill(this.checkInDate);
    await checkOutInput.fill(this.checkOutDate);

    await checkInInput.evaluate((el: HTMLInputElement) => el.dispatchEvent(new Event('change', { bubbles: true })));
    await checkOutInput.evaluate((el: HTMLInputElement) => el.dispatchEvent(new Event('change', { bubbles: true })));

    await page.fill('input[id="MainContentPlaceHolder_SearchPanel_SearchPanelLayout_RoomsComboBox_I"]', this.rooms);
    await page.fill('input[id="MainContentPlaceHolder_SearchPanel_SearchPanelLayout_AdultsSpinEdit_I"]', this.adults);
    await page.fill('input[id="MainContentPlaceHolder_SearchPanel_SearchPanelLayout_ChildrenSpinEdit_I"]', this.childrens);

    const searchButton = page.locator('#MainContentPlaceHolder_SearchPanel_SearchPanelLayout_SearchButton_CD');
    await searchButton.click();

    await page.waitForSelector('#MainContentPlaceHolder_FilterFormLayout_NightlyRateTrackBar_MD');

    await page.evaluate(() => {
      const priceControl = (window as any).ASPxClientControl.GetControlCollection().GetByName('MainContentPlaceHolder_FilterFormLayout_NightlyRateTrackBar');
      if (priceControl) {
        priceControl.SetValue([200, priceControl.GetValue()[1]]);
      } else {
        console.error('Control de precio no encontrado');
      }
    });

    await page.click('span[id="MainContentPlaceHolder_FilterFormLayout_OurRatingCheckBoxList_RB0_I_D"]');

    await page.click('span[id="MainContentPlaceHolder_FilterFormLayout_OurRatingCheckBoxList_RB1_I_D"]');

    await page.click('td[id="MainContentPlaceHolder_FilterFormLayout_5"]');

    await page.waitForSelector('.dxdvControl_Metropolis', { timeout: 60000 });


    const pagination = page.locator('.dxp-num');
    const totalPages = await pagination.count();

    let allPrices: { price: number; pageIndex: number; hotelIndex: number }[] = [];

    for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
      // 1. Extraer precios en la página actual
      const priceLocators = page.locator('//td[@id="MainContentPlaceHolder_HotelsDataView_ICell"]//div[contains(@class,"price")]');
      const count = await priceLocators.count();

      for (let i = 0; i < count; i++) {
        const priceText = await priceLocators.nth(i).innerText();
        const price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
        allPrices.push({ price, pageIndex: pageIndex + 1, hotelIndex: i });
      }

      if (pageIndex < totalPages - 1) {
        const nextButton = page.locator('#MainContentPlaceHolder_HotelsDataView_PGB_PBN');
        const currentPageText = await page.locator('.dxp-current').innerText();

        await nextButton.click();

        await page.waitForSelector(`.dxp-current:text-is("${parseInt(currentPageText) + 1}")`, { timeout: 60000 });
      }
    }

    console.log(`Total precios encontrados: ${allPrices.length}`);
    console.log('Precios:', allPrices);

    // Validar que hay precios
    if (allPrices.length === 0) {
      console.error(' No se encontraron precios.');
      return;
    }

    // Encontrar el hotel más barato
    const cheapestHotel = allPrices.reduce((min, hotel) => hotel.price < min.price ? hotel : min, allPrices[0]);
    console.log(`Hotel más barato: Precio = ${cheapestHotel.price}, Página = ${cheapestHotel.pageIndex}, Índice = ${cheapestHotel.hotelIndex}`);

    const currentPageText = await page.locator('.dxp-current').innerText();
    const currentPage = parseInt(currentPageText);

    if (currentPage === cheapestHotel.pageIndex) {
      console.log('Estamos en la página correcta, seleccionando el hotel más barato...');
    } else {
      console.log(`Navegando a la página ${cheapestHotel.pageIndex}...`);
      const targetPageButton = page.locator('.dxp-num').nth(cheapestHotel.pageIndex - 1);
      await Promise.all([
        targetPageButton.click(),
        page.waitForSelector(`.dxp-current:text-is("${cheapestHotel.pageIndex}")`, { timeout: 60000 })
      ]);
    }

    // Seleccionar el botón "Book It" del hotel más barato
    const hotelLocator = page.locator('//td[@id="MainContentPlaceHolder_HotelsDataView_ICell"]//table//tr//td[contains(@style,"vertical-align:Top")]').nth(cheapestHotel.hotelIndex);
    const bookButton = hotelLocator.locator('div[id*="BookItButton"]:not([id$="_CD"])');
    await bookButton.click();


    page.waitForLoadState('domcontentloaded'),
      page.waitForLoadState('networkidle')


    console.log(`Hotel más barato seleccionado: Precio = ${cheapestHotel.price}`);

    actor.remember('cheapestPrice', cheapestHotel.price);
    actor.remember('checkInDate', this.checkInDate);
    actor.remember('checkOutDate', this.checkOutDate);

  }
}