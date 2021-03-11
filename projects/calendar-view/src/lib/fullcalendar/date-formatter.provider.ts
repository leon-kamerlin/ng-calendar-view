import { CalendarNativeDateFormatter, DateFormatterParams } from 'angular-calendar';

export class CustomDateFormatter extends CalendarNativeDateFormatter {
    public dayViewHour({ date, locale }: DateFormatterParams): string {
        // change this to return a different date format
        return new Intl.DateTimeFormat(locale, { hour: 'numeric' }).format(date);
    }

}
