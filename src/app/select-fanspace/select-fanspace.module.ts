import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectFanspaceComponent } from './select-fanspace/select-fanspace.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { SelectFanspaceRoutingModule } from './select-fanspace-routing.module';



@NgModule({
  declarations: [SelectFanspaceComponent],
  imports: [
    CommonModule,
    SelectFanspaceRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class SelectFanspaceModule { }
