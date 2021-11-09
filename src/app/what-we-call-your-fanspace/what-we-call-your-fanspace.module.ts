import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WhatWeCallYourFanspaceComponent } from './what-we-call-your-fanspace/what-we-call-your-fanspace.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { WhatWeCallYourFanspaceRoutingModule } from './what-we-call-your-fanspace-routing.module';



@NgModule({
  declarations: [WhatWeCallYourFanspaceComponent],
  imports: [
    CommonModule,
    WhatWeCallYourFanspaceRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class WhatWeCallYourFanspaceModule { }
