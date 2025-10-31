import { Actor } from '@core/actor/Actor';
import { OpenBrowser } from '@tasks/OpenBrowser';
import { test, expect } from '@playwright/test';
import { getFutureDate } from '@utils/DateUtils';
import { SearchHotel } from '@core/task/SearchHotel';
import{ValidateTotalPrice} from '@core/question/ValidateTotalPrice';

test('Realizar una reservacion', async ({page}) => {
  
  test.setTimeout(120000); // 2 minutos

  const actor = new Actor('Angie');
  const openDXHotel = OpenBrowser.at('https://demos.devexpress.com/rwa/dxhotels/');
  await openDXHotel.perform();
  actor.setPage(openDXHotel.getPage()!);

  const checkInDate = getFutureDate(2);
  const checkOutDate = getFutureDate(7);
  const rooms = "2";
  const adults = "3";
  const children = "2";

  await actor.attemptsTo(SearchHotel.for(checkInDate, checkOutDate, rooms, adults, children));
  await ValidateTotalPrice.isCorrect().answeredBy(actor, page);

  await openDXHotel.close();
})