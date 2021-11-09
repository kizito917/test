import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ParticipantInviteRoutingModule } from './participant-invite-routing.module';
import { SharedModule } from '../shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ParticipantInviteComponent } from './participant-invite/participant-invite.component';

@NgModule({
  declarations: [ParticipantInviteComponent],
  imports: [
    CommonModule,
    ParticipantInviteRoutingModule,
    SharedModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class ParticipantInviteModule { }
