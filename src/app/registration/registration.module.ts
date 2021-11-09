import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModeratorSignupComponent } from './moderator-signup/moderator-signup.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RegistrationRoutingModule } from './registration-routing.module';


@NgModule({
  declarations: [ModeratorSignupComponent],
  imports: [
    CommonModule,
    RegistrationRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class RegistrationModule { }
