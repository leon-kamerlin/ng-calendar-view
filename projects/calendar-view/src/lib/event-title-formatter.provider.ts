import { CalendarEvent, CalendarEventTitleFormatter } from 'angular-calendar';
import { MetaEvent } from 'leon-angular-utils';

export class CustomEventTitleFormatter extends CalendarEventTitleFormatter {

    private static generateHtml(event: CalendarEvent<MetaEvent>): string {
        let html = '';
        if (!(event.start && event.end)) {
            return '';
        }

        html += `<b>${
            event.start.getHours() + ':' + event.start.getMinutes() + ' - ' + event.end.getHours() + ':' + event.end.getMinutes()
        }</b>`;

        html += `<br />`;


        html += `<b>Services:</b>`;
        html += `<ul>${event?.meta?.services.reduce((acc, curr) => acc + '<li>' + curr + '</li>', '')}</ul>`;

        html += `${event?.meta?.clientName ? '<b>Client:</b>' : ''}`;

        html += `${event?.meta?.clientId ? event.meta.clientId : ''}`;

        // html += `<p class="mat-h3">${event.title}</p>`;

        return html;
    }


    // you can override any of the methods defined in the parent class

    month(event: CalendarEvent<MetaEvent>): string {
        return CustomEventTitleFormatter.generateHtml(event);
    }

    week(event: CalendarEvent<MetaEvent>): string {
        return CustomEventTitleFormatter.generateHtml(event);
    }

    day(event: CalendarEvent<MetaEvent>): string {
        return CustomEventTitleFormatter.generateHtml(event);
    }
}
