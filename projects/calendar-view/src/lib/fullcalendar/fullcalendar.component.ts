import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    LOCALE_ID,
    OnInit,
    Output,
    ViewEncapsulation
} from '@angular/core';
import { ceilToNearest, defaultEvent, floorToNearest, hourSegments } from './helpers';

import {
    CalendarDateFormatter,
    CalendarEvent,
    CalendarEventTimesChangedEvent,
    CalendarEventTitleFormatter,
    CalendarMonthViewBeforeRenderEvent,
    CalendarView,
    CalendarWeekViewBeforeRenderEvent,
    DAYS_OF_WEEK
} from 'angular-calendar';
import * as uuid from 'uuid';
import { CustomEventTitleFormatter } from './event-title-formatter.provider';
import { CustomDateFormatter } from './date-formatter.provider';
import { registerLocaleData } from '@angular/common';
import localeHr from '@angular/common/locales/hr';
import { addDays, addMinutes, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { WeekViewHourSegment } from 'calendar-utils';
import { fromEvent } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { MatSelectChange } from '@angular/material/select';
import { MetaEvent } from '../meta-event';


export interface HourSegment {
    value: number;
    viewValue: number;
}

type CalendarPeriod = 'day' | 'week' | 'month';

@Component({
    selector: 'lib-fullcalendar',
    templateUrl: './fullcalendar.component.html',
    styleUrls: ['./fullcalendar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    providers: [
        {
            provide: CalendarEventTitleFormatter,
            useClass: CustomEventTitleFormatter
        },
        {
            provide: CalendarDateFormatter,
            useClass: CustomDateFormatter
        },
        { provide: LOCALE_ID, useValue: 'en-EN' },
    ]
})
export class FullcalendarComponent implements OnInit {
    private temporarilyEvents: CalendarEvent<MetaEvent>[] = [];
    private dragToCreateActive = false;
    private newEvent: CalendarEvent<MetaEvent>;

    @Input()
    view: CalendarView = CalendarView.Month;
    @Input()
    calendarTitleView = 'weekViewTitle';
    @Input()
    viewDate: Date = new Date();
    locale = 'hr-HR';
    @Input()
    excludeDays: number[] = [];
    weekStartsOn = DAYS_OF_WEEK.MONDAY;
    @Input()
    dayStartHour = 8;
    @Input()
    dayEndHour = 18;
    @Input()
    hourSegments = 4;
    @Input()
    segments: HourSegment[] = hourSegments;
    @Input()
    events: CalendarEvent<MetaEvent>[] = [];

    @Output()
    createEvent: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();
    @Output()
    eventMoved: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();
    @Output()
    eventClicked: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();


    constructor(private cdr: ChangeDetectorRef) {
    }


    ngOnInit() {
        registerLocaleData(localeHr);
        if (localStorage.getItem('calendarHourSegment')) {
            this.hourSegments = Number(localStorage.getItem('calendarHourSegment'));
        }

        // this.startOfPeriod(this.view, new Date())
    }


    private refresh() {
        this.events = [...this.events];
        this.cdr.detectChanges();
    }

    private addNewEvent(event: CalendarEvent<MetaEvent>) {
        this.events = [...this.events, event];
    }


    private addTemporallyEvent(event: CalendarEvent<MetaEvent>) {
        this.temporarilyEvents = [...this.temporarilyEvents, event];
    }

    private removeEvent(removeEvent: CalendarEvent<MetaEvent>) {
        this.events = [...this.events.filter(event => removeEvent.start !== event.start && removeEvent.end !== event.end)];
        this.refresh();
    }

    startOfPeriod(period: CalendarPeriod, date: Date): Date {
        return {
            day: startOfDay,
            week: startOfWeek,
            month: startOfMonth,
        }[period](date);
    }


    startDragToCreate(segment: WeekViewHourSegment, mouseDownEvent: MouseEvent, segmentElement: HTMLElement) {

        // mouse down event
        this.newEvent = {
            ...defaultEvent,
            id: uuid.v4(),
            start: segment.date,
            end: addMinutes(new Date(), 30)
        };
        this.addNewEvent(this.newEvent);

        const segmentPosition = segmentElement.getBoundingClientRect();
        this.dragToCreateActive = true;
        const endOfView = endOfWeek(this.viewDate);

        // mouse move event
        fromEvent(document, 'mousemove').pipe(
            finalize(() => {
                this.dragToCreateActive = false;
                this.refresh();
            }),
            takeUntil(fromEvent(document, 'mouseup'))
        ).subscribe((mouseMoveEvent: MouseEvent) => {

            const minutesDiff = ceilToNearest((mouseMoveEvent.clientY - segmentPosition.top) /
                (this.hourSegments / 2), (60 / this.hourSegments));

            const daysDiff = floorToNearest(mouseMoveEvent.clientX - segmentPosition.left, segmentPosition.width) / segmentPosition.width;

            const newEnd = addDays(addMinutes(segment.date, minutesDiff), daysDiff);
            if (newEnd > segment.date && newEnd < endOfView) {
                this.newEvent.end = newEnd;
            } else {
                this.newEvent.start = newEnd;
            }
            this.refresh();
        });

        // mouse up event
        fromEvent(document, 'mouseup').subscribe(_ => {
            const index: number = this.temporarilyEvents.findIndex(event => {
                return event.id === this.newEvent.id;
            });
            if (index === -1) {
                // Event doesn't exist create new event
                this.addTemporallyEvent(this.newEvent);
                this.createEvent.emit(this.newEvent);
            }
        });
    }

    onEventMoved(changeEvent: CalendarEventTimesChangedEvent) {
        const movedEvent: CalendarEvent<MetaEvent> = {
            ...changeEvent.event,
            start: changeEvent.newStart,
            end: changeEvent.newEnd
        };

        const events = this.events.map(event => (event?.id === movedEvent?.id) ? movedEvent : event);
        this.events = [...events];
        this.eventMoved.emit(movedEvent);
    }

    onEventClicked(event: CalendarEvent<MetaEvent>) {
        this.eventClicked.emit({
            ...event as CalendarEvent<MetaEvent>
        });
    }

    onDayClicked(date: Date) {
        this.viewDate = date;
        this.changeViewToDay();

    }

    onDayHeaderClicked(date: Date) {
        this.viewDate = date;
        this.changeViewToDay();
    }

    onViewDateChange(date: Date) {
    }


    changeViewToMonth() {
        this.calendarTitleView = 'monthViewTitle';
        this.view = CalendarView.Month;
    }

    changeViewToWeek() {
        this.calendarTitleView = 'weekViewTitle';
        this.view = CalendarView.Week;
    }

    changeViewToDay() {
        this.calendarTitleView = 'dayViewTitle';
        this.view = CalendarView.Day;

    }

    dateIsValid(date: Date): boolean {
        return date >= new Date();
    }

    onHourSegmentChange(matSelectChange: MatSelectChange) {
        const { value } = matSelectChange;
        localStorage.setItem('calendarHourSegment', value);
    }

    beforeMonthViewRender(event: CalendarMonthViewBeforeRenderEvent) {
        event.body.forEach((day) => {
            if (!this.dateIsValid(day.date)) {
                day.cssClass = 'cal-disabled';
            }
        });
    }

    beforeWeekViewRender(event: CalendarWeekViewBeforeRenderEvent) {
        event.hourColumns.forEach((columns) => {
            if (!this.dateIsValid(columns.date)) {
                columns.hours.forEach((hour) => {
                    hour.segments.forEach((segment) => {
                        if (!this.dateIsValid(segment.date)) {
                            segment.cssClass = 'cal-disabled';
                        }
                    });
                });
            }
        });
    }
}
