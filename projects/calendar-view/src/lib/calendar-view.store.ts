import { Injectable } from '@angular/core';
import { CalendarEvent, CalendarView, DAYS_OF_WEEK } from 'angular-calendar';
import { MetaEvent, SelectorView } from 'leon-angular-utils';
import { ComponentStore } from '@ngrx/component-store';
import { hourSegments } from './helpers';
import { distinctUntilChanged } from 'rxjs/operators';

export interface CalendarViewState {
    view: CalendarView;
    calendarTitleView: string;
    viewDate: Date;
    locale: string;
    excludeDays: DAYS_OF_WEEK[];
    weekStartsOn: DAYS_OF_WEEK;
    dayStartHour: number;
    dayEndHour: number;
    hourSegments: number;
    segments: SelectorView[];
    events: CalendarEvent<MetaEvent>[];
}

@Injectable()
export class CalendarViewStore extends ComponentStore<CalendarViewState> {
    constructor() {
        super({
            view: CalendarView.Week,
            calendarTitleView: 'weekViewTitle',
            viewDate: new Date(),
            locale: 'en-EN',
            excludeDays: [
                DAYS_OF_WEEK.SATURDAY,
                DAYS_OF_WEEK.SUNDAY
            ],
            weekStartsOn: DAYS_OF_WEEK.MONDAY,
            dayStartHour: 8,
            dayEndHour: 18,
            hourSegments: 4,
            segments: hourSegments,
            events: [],
        });
    }

    readonly addEvent = this.updater(
        (state: CalendarViewState, event: CalendarEvent<MetaEvent>) => ({ ...state, events: [...state.events, event] })
    );

    readonly removeEvent = this.updater(
        (state: CalendarViewState, event: CalendarEvent<MetaEvent>) => ({
            ...state,
            events: state.events.filter(item => item.id !== event.id)
        })
    );

    readonly updateEvent = this.updater(
        (state: CalendarViewState, event: CalendarEvent<MetaEvent>) => ({
            ...state,
            events: state.events.map(item => item.id === event.id ? event : item)
        })
    );

    readonly state$ = this.select(state => state).pipe(
        distinctUntilChanged()
    );
    readonly calendarTitleView$ = this.select(state => state.calendarTitleView).pipe(
        distinctUntilChanged()
    );
    readonly dayEndHour$ = this.select(state => state.dayEndHour).pipe(
        distinctUntilChanged()
    );
    readonly dayStartHour$ = this.select(state => state.dayStartHour).pipe(
        distinctUntilChanged()
    );
    readonly events$ = this.select(state => state.events).pipe(
        distinctUntilChanged()
    );
    readonly excludeDays$ = this.select(state => state.excludeDays).pipe(
        distinctUntilChanged()
    );
    readonly hourSegments$ = this.select(state => state.hourSegments).pipe(
        distinctUntilChanged()
    );
    readonly locale$ = this.select(state => state.locale).pipe(
        distinctUntilChanged()
    );
    readonly segments$ = this.select(state => state.segments).pipe(
        distinctUntilChanged()
    );
    readonly view$ = this.select(state => state.view).pipe(
        distinctUntilChanged()
    );
    readonly viewDate$ = this.select(state => state.viewDate).pipe(
        distinctUntilChanged()
    );
    readonly weekStartsOn$ = this.select(state => state.weekStartsOn).pipe(
        distinctUntilChanged()
    );

    readonly setHourSegments = (hs: number) => {
        this.patchState({ hourSegments: hs });
    }


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
        this.patchState({
            view,
            calendarTitleView
        });
    }

    readonly setViewDate = (viewDate: Date) => {
        this.patchState({ viewDate });
    }
}
