import { ChangeDetectionStrategy, Component, EventEmitter, Input, LOCALE_ID, OnInit, Output, ViewEncapsulation } from '@angular/core';
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
import { finalize, first, takeUntil } from 'rxjs/operators';
import { MatSelectChange } from '@angular/material/select';
import { ComponentStore } from '@ngrx/component-store';
import { SelectorView } from 'leon-angular-utils';
import { MetaEvent } from './meta-event';

interface State {
    view: CalendarView;
    calendarTitleView: string;
    viewDate: Date;
    locale: string;
    excludeDays: number[];
    weekStartsOn: DAYS_OF_WEEK;
    dayStartHour: number;
    dayEndHour: number;
    hourSegments: number;
    segments: SelectorView[];
    events: CalendarEvent<MetaEvent>[];
    temporarilyEvents: CalendarEvent<MetaEvent>[];
}

type CalendarPeriod = 'day' | 'week' | 'month';

@Component({
    selector: 'lib-calendar-view',
    templateUrl: './calendar-view.component.html',
    styleUrls: ['./calendar-view.component.scss'],
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
        ComponentStore
    ]
})
export class CalendarViewComponent implements OnInit {

    constructor(private readonly componentStore: ComponentStore<State>) {
        this.componentStore.setState({
            view: CalendarView.Week,
            calendarTitleView: 'weekViewTitle',
            viewDate: new Date(),
            locale: 'en-EN',
            excludeDays: [],
            weekStartsOn: DAYS_OF_WEEK.MONDAY,
            dayStartHour: 8,
            dayEndHour: 18,
            hourSegments: 4,
            segments: hourSegments,
            events: [],
            temporarilyEvents: []
        });
    }

    private dragToCreateActive = false;
    private newEvent: CalendarEvent<MetaEvent>;


    readonly state$ = this.componentStore.select(state => state);

    @Output()
    createEvent: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();
    @Output()
    eventMoved: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();
    @Output()
    eventClicked: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();

    readonly addEvent = this.componentStore.updater(
        (state: State, event: CalendarEvent<MetaEvent>) => ({ ...state, events: [...state.events, event] })
    );

    readonly removeEvent = this.componentStore.updater(
        (state: State, event: CalendarEvent<MetaEvent>) => ({ ...state, events: state.events.filter(item => item.id !== event.id) })
    );

    readonly updateEvent = this.componentStore.updater(
        (state: State, event: CalendarEvent<MetaEvent>) => ({
            ...state,
            events: state.events.map(item => item.id === event.id ? event : item)
        })
    );


    readonly removeTemporarilyEvent = this.componentStore.updater(
        (state: State, event: CalendarEvent<MetaEvent>) => ({
            ...state,
            temporarilyEvents: state.temporarilyEvents.filter(item => item.id !== event.id)
        })
    );

    readonly addTemporarilyEvent = this.componentStore.updater(
        (state: State, event: CalendarEvent<MetaEvent>) => ({ ...state, temporarilyEvents: [...state.temporarilyEvents, event] })
    );


    readonly setView = (view: CalendarView) => {
        let calendarTitleView = 'weekViewTitle';

        switch (view) {
            case CalendarView.Day:
                calendarTitleView = 'dayViewTitle';
                break;
            case CalendarView.Week:
                calendarTitleView = 'weekViewTitle';
                break;
            case CalendarView.Month:
                calendarTitleView = 'monthViewTitle';

        }
        this.componentStore.patchState({
            view,
            calendarTitleView
        });
    }

    readonly setViewDate = (viewDate: Date) => {
        this.componentStore.patchState({ viewDate });
    }


    ngOnInit() {
        registerLocaleData(localeHr);
        if (localStorage.getItem('calendarHourSegment')) {
            const hs: number = Number(localStorage.getItem('calendarHourSegment'));
            this.componentStore.patchState({ hourSegments: hs });
        }

        this.state$.pipe(
            first()
        ).subscribe((state) => {
            this.startOfPeriod(state.view, new Date());
        });
    }


    startOfPeriod(period: CalendarPeriod, date: Date): Date {
        return {
            day: startOfDay,
            week: startOfWeek,
            month: startOfMonth,
        }[period](date);
    }


    startDragToCreate(segment: WeekViewHourSegment, mouseDownEvent: MouseEvent, segmentElement: HTMLElement) {
        this.state$.pipe(
            first()
        ).subscribe((state) => {
            // mouse down event
            this.newEvent = {
                ...defaultEvent,
                id: uuid.v4(),
                start: segment.date,
                end: addMinutes(new Date(), 30)
            };
            this.addEvent(this.newEvent);

            const segmentPosition = segmentElement.getBoundingClientRect();
            this.dragToCreateActive = true;
            const endOfView = endOfWeek(state.viewDate);

            // mouse move event
            fromEvent(document, 'mousemove').pipe(
                finalize(() => {
                    this.dragToCreateActive = false;
                }),
                takeUntil(fromEvent(document, 'mouseup'))
            ).subscribe((mouseMoveEvent: MouseEvent) => {

                const minutesDiff = ceilToNearest((mouseMoveEvent.clientY - segmentPosition.top) /
                    (state.hourSegments / 2), (60 / state.hourSegments));

                const daysDiff = floorToNearest(mouseMoveEvent.clientX - segmentPosition.left, segmentPosition.width) / segmentPosition.width;

                const newEnd = addDays(addMinutes(segment.date, minutesDiff), daysDiff);
                if (newEnd > segment.date && newEnd < endOfView) {
                    this.newEvent.end = newEnd;
                } else {
                    this.newEvent.start = newEnd;
                }

                this.updateEvent(this.newEvent);
            });

            // mouse up event
            fromEvent(document, 'mouseup').subscribe(_ => {
                const index: number = state.temporarilyEvents.findIndex(event => {
                    return event.id === this.newEvent.id;
                });
                if (index === -1) {
                    // Event doesn't exist create new event
                    this.addTemporarilyEvent(this.newEvent);
                    this.createEvent.emit(this.newEvent);
                }
            });
        });

    }

    onEventMoved(changeEvent: CalendarEventTimesChangedEvent) {
        const movedEvent: CalendarEvent<MetaEvent> = {
            ...changeEvent.event,
            start: changeEvent.newStart,
            end: changeEvent.newEnd
        };

        this.updateEvent(movedEvent);
        this.eventMoved.emit(movedEvent);
    }

    onEventClicked(event: CalendarEvent<MetaEvent>) {
        this.eventClicked.emit({
            ...event as CalendarEvent<MetaEvent>
        });
    }

    onDayClicked(date: Date) {
        this.setViewDate(date);
        this.changeViewToDay();

    }

    onDayHeaderClicked(date: Date) {
        this.setViewDate(date);
        this.changeViewToDay();
    }

    onViewDateChange(viewDate: Date) {
        this.setViewDate(viewDate);
    }


    changeViewToMonth() {
        this.setView(CalendarView.Month);
    }

    changeViewToWeek() {
        this.setView(CalendarView.Week);
    }

    changeViewToDay() {
        this.setView(CalendarView.Day);
    }

    dateIsValid(date: Date): boolean {
        return date >= new Date();
    }

    onHourSegmentChange(matSelectChange: MatSelectChange) {
        const { value } = matSelectChange;
        localStorage.setItem('calendarHourSegment', value);

        this.componentStore.patchState({
            hourSegments: value
        });
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
