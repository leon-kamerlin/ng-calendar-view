import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { FullcalendarModule } from 'calendar-view';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    FullcalendarModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
