import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { CalendarEvent, EventColor } from 'calendar-utils';
import { EventFormDialogComponent } from './dialog/event-form-dialog/event-form-dialog.component';
import { MatColor, MetaEvent } from 'leon-angular-utils';
import { Client, DataDispatcher, DispatcherActionTypes, ServiceCategory } from 'leon-angular-utils';

export class EventFromSignature {
    note?: string;
    start: string;
    end: string;
    color?: EventColor;
    services?: Array<string>;
    client: string;
}

@Component({
    selector: 'lib-event-form',
    templateUrl: './event-form.component.html',
    styleUrls: ['./event-form.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EventFormComponent implements OnInit, OnChanges {
    form: FormGroup;
    @Input()
    event: CalendarEvent<MetaEvent>;
    @Input()
    serviceCategories: Array<ServiceCategory> = [];
    @Input()
    clients: Array<Client> = [];
    @Input()
    employeeId: string;
    @Output()
    submitted: EventEmitter<DataDispatcher<CalendarEvent<MetaEvent>>> = new EventEmitter<DataDispatcher<CalendarEvent<MetaEvent>>>();

    constructor(private fb: FormBuilder) {
        this.form = this.fb.group({
            note: [null, []],
            start: [null, [Validators.required]],
            end: [null, [Validators.required]],
            color: [null, []],
            services: [[], []],
            client: [null, []],
        });
    }

    ngOnInit() {

    }

    ngOnChanges(changes: SimpleChanges) {
        this.updateForm(changes?.event?.currentValue);
    }

    private updateForm(event: CalendarEvent<MetaEvent>) {
        this.note.setValue(event?.meta?.note);
        this.start.setValue(event?.start);
        this.end.setValue(event?.end);
        this.color.setValue(event?.color);
        this.services.setValue(event?.meta?.services);
        this.client.setValue(event?.meta?.clientId);
    }

    get note(): FormControl {
        return this.form.get('note') as FormControl;
    }

    get start(): FormControl {
        return this.form.get('start') as FormControl;
    }

    get end(): FormControl {
        return this.form.get('end') as FormControl;
    }

    get color(): FormControl {
        return this.form.get('color') as FormControl;
    }

    get services(): FormControl {
        return this.form.get('services') as FormControl;
    }

    get client(): FormControl {
        return this.form.get('client') as FormControl;
    }

    onSubmit(value: any) {
        let meta: MetaEvent = {
            services: value?.services || [],
            clientId: value?.client,
            employeeId: this.employeeId
        };

        const matColor: MatColor = value?.color;

        const color: EventColor = {
            primary: matColor.dark,
            secondary: matColor.light
        };

        // deletes undefined properties
        meta = _.pickBy(meta, _.identity);

        delete value?.services;
        delete value?.client;
        const data: CalendarEvent<MetaEvent> = {
            ...this.event, ...value, meta, color
        };

        if (EventFormDialogComponent.hasCalendarEventEmployeeId(data)) {
            this.submitted.emit({
                data: _.pickBy(data, _.identity),
                action: DispatcherActionTypes.UPDATE
            });
        } else {
            this.submitted.emit({
                data: _.pickBy(data, _.identity),
                action: DispatcherActionTypes.CREATE
            });
        }

    }

    onDelete() {
        let meta: MetaEvent = {
            services: [],
            employeeId: this.employeeId
        };
        // deletes undefined properties
        meta = _.pickBy(meta, _.identity);
        const data = { ...this.event, meta };
        this.submitted.emit({
            data,
            action: DispatcherActionTypes.DELETE
        });
    }

    close() {


        let meta: MetaEvent = {
            services: [],
            employeeId: this.employeeId
        };
        // deletes undefined properties
        meta = _.pickBy(meta, _.identity);
        const data = { ...this.event, meta };
        this.submitted.emit({
            data,
            action: DispatcherActionTypes.CLOSE_DIALOG
        });
    }


}
