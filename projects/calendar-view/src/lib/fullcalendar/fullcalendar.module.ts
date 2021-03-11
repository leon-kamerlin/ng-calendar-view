import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FullcalendarComponent } from './fullcalendar.component';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ExtendedModule, FlexModule } from '@angular/flex-layout';
import { CalendarCommonModule, CalendarModule, DateAdapter } from 'angular-calendar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { MatDialogModule } from '@angular/material/dialog';


@NgModule({
    declarations: [
        FullcalendarComponent
    ],
    exports: [
        FullcalendarComponent
    ],
    imports: [
        CommonModule,
        MatButtonModule,
        MatToolbarModule,
        FlexModule,
        CalendarCommonModule,
        ExtendedModule,
        MatIconModule,
        MatCardModule,
        MatDialogModule,
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory
        }),
    ]
})
export class FullcalendarModule {
}
