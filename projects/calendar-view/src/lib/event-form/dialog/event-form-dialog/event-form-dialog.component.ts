import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { CalendarEvent } from 'angular-calendar';
import { Observable } from 'rxjs';
import { DataDispatcher, MetaEvent, Person, ServiceCategory } from 'leon-angular-utils';

export interface DialogData {
    event: CalendarEvent<MetaEvent>;
    clients: Array<Person>;
    serviceCategories: Array<ServiceCategory>;
}

@Component({
    selector: 'lib-event-form-dialog',
    templateUrl: './event-form-dialog.component.html',
    styleUrls: ['./event-form-dialog.component.scss']
})
export class EventFormDialogComponent implements OnInit {

    constructor(
        private dialogRef: MatDialogRef<EventFormDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
    }

    public static openDialog(
        matDialog: MatDialog,
        data?: DialogData
    ): Observable<DataDispatcher<CalendarEvent>> {
        return matDialog.open(EventFormDialogComponent, {
            data
        }).afterClosed();
    }

    public static hasCalendarEventEmployeeId(object: CalendarEvent<MetaEvent>): boolean {
        return !!object?.meta?.employeeId;
    }

    ngOnInit() {
    }

    onSubmit(event: DataDispatcher<CalendarEvent<MetaEvent>>) {
        this.dialogRef.close(event);
    }

}
