import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatsYourNameComponent } from './whats-your-name/whats-your-name.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { WhatsYourNameRoutingModule } from './whats-your-name-routing.module';



@NgModule({
  declarations: [WhatsYourNameComponent],
  imports: [
    CommonModule,
    WhatsYourNameRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class WhatsYourNameModule { }
