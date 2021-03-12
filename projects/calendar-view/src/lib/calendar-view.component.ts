import { ChangeDetectionStrategy, Component, EventEmitter, Input, LOCALE_ID, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ceilToNearest, defaultEvent, floorToNearest } from './helpers';

import {
    CalendarDateFormatter,
    CalendarEvent,
    CalendarEventTimesChangedEvent,
    CalendarEventTitleFormatter,
    CalendarMonthViewBeforeRenderEvent,
    CalendarView,
    CalendarWeekViewBeforeRenderEvent
} from 'angular-calendar';
import * as uuid from 'uuid';
import { CustomEventTitleFormatter } from './event-title-formatter.provider';
import { CustomDateFormatter } from './date-formatter.provider';
import { registerLocaleData } from '@angular/common';
import localeHr from '@angular/common/locales/hr';
import { addDays, addMinutes, endOfWeek, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { WeekViewHourSegment } from 'calendar-utils';
import { fromEvent, pipe } from 'rxjs';
import { finalize, first, takeUntil } from 'rxjs/operators';
import { MatSelectChange } from '@angular/material/select';
import { Client, DispatcherActionTypes, MetaEvent, ServiceCategory } from 'leon-angular-utils';
import { CalendarViewStore } from './calendar-view.store';
import { EventFormDialogComponent } from './event-form/dialog/event-form-dialog/event-form-dialog.component';
import { MatDialog } from '@angular/material/dialog';


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
        CalendarViewStore
    ]
})
export class CalendarViewComponent implements OnInit {
    private dragToCreateActive = false;
    private newEvent: CalendarEvent<MetaEvent>;

    @Input()
    services: Array<ServiceCategory> = [];
    @Input()
    clients: Array<Client> = [
        {
            firstName: 'Leon',
            lastName: 'Kamerlin',
            email: 'leon@gmail.com',
            gender: 'male'
        }
    ];

    @Input()
    employeeId = 'someRandomTestId';

    @Output()
    eventCreated: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();
    @Output()
    eventUpdated: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();
    @Output()
    eventDeleted: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();
    @Output()
    eventClicked: EventEmitter<CalendarEvent<MetaEvent>> = new EventEmitter();


    constructor(
        private matDialog: MatDialog,
        public readonly store: CalendarViewStore
    ) {

    }

    ngOnInit() {
        registerLocaleData(localeHr);
        if (localStorage.getItem('calendarHourSegment')) {
            const hs: number = Number(localStorage.getItem('calendarHourSegment'));
            this.store.setHourSegments(hs);
        }

        this.store.view$.pipe(
            first()
        ).subscribe((view) => {
            this.startOfPeriod(view, new Date());
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
        console.log('startDragToCreate');
        this.store.state$.pipe(
            first()
        ).subscribe((state) => {
            // mouse down event
            this.newEvent = {
                ...defaultEvent,
                id: uuid.v4(),
                start: segment.date,
                end: addMinutes(new Date(), 30)
            };
            this.store.addEvent(this.newEvent);

            const segmentPosition = segmentElement.getBoundingClientRect();
            this.dragToCreateActive = true;
            const endOfView = endOfWeek(state.viewDate);

            // mouse move event
            fromEvent(document, 'mousemove').pipe(
                finalize(() => {
                    console.log('Finalize');
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

                this.store.updateEvent(this.newEvent);
            });

            // mouse up event
            fromEvent(document, 'mouseup')
                .pipe(
                    first()
                )
                .subscribe(_ => {
                    this.openEventDialog(this.matDialog, this.newEvent, false);
                });
        });

    }

    private openEventDialog(matDialog: MatDialog, event: CalendarEvent<MetaEvent>, isExistingEvent: boolean) {
        EventFormDialogComponent.openDialog(matDialog, {
            event,
            serviceCategories: [],
            clients: this.clients,
            employeeId: this.employeeId
        }).pipe(
            first()
        ).subscribe((result) => {
            if (result.action === DispatcherActionTypes.UPDATE) {
                this.eventUpdated.emit(result.data);
                this.store.updateEvent(result.data);
            } else if (result.action === DispatcherActionTypes.DELETE) {
                this.eventDeleted.emit(result.data);
                this.store.removeEvent(result.data);
            } else if (result.action === DispatcherActionTypes.CREATE) {
                this.eventCreated.emit(result.data);
                this.store.updateEvent(result.data);
            } else if (result.action === DispatcherActionTypes.CLOSE_DIALOG) {
                console.log('CloseDialog');
                this.store.removeEvent(result.data);
            }
        });
    }

    onEventMoved(changeEvent: CalendarEventTimesChangedEvent) {
        const movedEvent: CalendarEvent<MetaEvent> = {
            ...changeEvent.event,
            start: changeEvent.newStart,
            end: changeEvent.newEnd
        };

        this.store.updateEvent(movedEvent);
        this.eventUpdated.emit(movedEvent);
    }

    onEventClicked(event: CalendarEvent<MetaEvent>) {
        console.log('onEventClicked');
        this.eventClicked.emit(event);
        this.openEventDialog(this.matDialog, event, true);
    }

    onDayClicked(date: Date) {
        this.store.setViewDate(date);
        this.changeViewToDay();

    }

    onDayHeaderClicked(date: Date) {
        this.store.setViewDate(date);
        this.changeViewToDay();
    }

    onViewDateChange(viewDate: Date) {
        this.store.setViewDate(viewDate);
    }


    changeViewToMonth() {
        this.store.setView(CalendarView.Month);
    }

    changeViewToWeek() {
        this.store.setView(CalendarView.Week);
    }

    changeViewToDay() {
        this.store.setView(CalendarView.Day);
    }

    dateIsValid(date: Date): boolean {
        return date >= new Date();
    }

    onHourSegmentChange(matSelectChange: MatSelectChange) {
        const { value } = matSelectChange;
        localStorage.setItem('calendarHourSegment', value);
        this.store.setHourSegments(value);
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
