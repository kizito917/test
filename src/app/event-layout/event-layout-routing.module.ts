import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { EventLayoutComponent } from './event-layout.component';
import { EventModeratorDashboardComponent } from './event-moderator-dashboard/event-moderator-dashboard.component';
import { EventAttendeeDashboardComponent } from './event-attendee-dashboard/event-attendee-dashboard.component';
import { FeedbackComponent } from './feedback/feedback.component';
import { WaitingToJoinComponent } from './waiting-to-join/waiting-to-join.component';
import { LeaveComponentGuard } from '../shared';

const routes: Routes = [
  {
    path: '',
    component: EventLayoutComponent,
    children: [
      //{ path: '', redirectTo: 'event-moderator-dashboard' },
      { path: 'event-moderator-dashboard/:event_code', component: EventModeratorDashboardComponent, canDeactivate: [LeaveComponentGuard] },
      { path: 'event-attendee-dashboard/:event_code', component: EventAttendeeDashboardComponent, canDeactivate: [LeaveComponentGuard] },
      { path: 'feedback/:event_code', component: FeedbackComponent },
      { path: 'join/:event_code', component: WaitingToJoinComponent },
      { path: '**', redirectTo: 'not-found' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EventLayoutRoutingModule { }
