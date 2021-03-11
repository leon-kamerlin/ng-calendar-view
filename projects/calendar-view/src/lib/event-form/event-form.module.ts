import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventFormComponent } from './event-form.component';
import { EventFormDialogComponent } from './dialog/event-form-dialog/event-form-dialog.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { DeleteButtonModule, MaterialColorPickerModule, TimePickerModule } from 'ng-components-leon';
import { FieldRequiredModule } from 'leon-angular-utils';


@NgModule({
    declarations: [
        EventFormComponent,
        EventFormDialogComponent
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatSelectModule,
        FieldRequiredModule,
        TimePickerModule,
        MaterialColorPickerModule,
        DeleteButtonModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule
    ],
    exports: [
        EventFormComponent
    ]
})
export class EventFormModule {
}
