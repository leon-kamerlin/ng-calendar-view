import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CalendarViewComponent } from './calendar-view.component';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ExtendedModule, FlexModule } from '@angular/flex-layout';
import { CalendarCommonModule, CalendarModule, DateAdapter } from 'angular-calendar';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
    declarations: [
        CalendarViewComponent
    ],
    exports: [
        CalendarViewComponent
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
        BrowserAnimationsModule,
        MatDialogModule,
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory
        }),
        MatFormFieldModule,
        MatSelectModule,
    ]
})
export class CalendarViewModule {
}
