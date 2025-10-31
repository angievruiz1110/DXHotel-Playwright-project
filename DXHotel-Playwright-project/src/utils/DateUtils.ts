export function getFutureDate(daysToAdd: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);

  const day = date.getDate().toString().padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' }); // Oct, Nov, etc.
  const year = date.getFullYear();

  return `${day} ${month} ${year}`; // Ej: "31 Oct 2025"
}
export class DateUtils {
  static calculateNights(checkIn: string, checkOut: string): number {
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diffTime = outDate.getTime() - inDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}