import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LayoutComponent } from './layout.component';
import { ModeratorDashboardComponent } from './moderator-dashboard/moderator-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { EventDetailsComponent } from './event-details/event-details.component';
import { EditFanspaceComponent } from './edit-fanspace/edit-fanspace.component';
import { AttendeeDashboardComponent } from './attendee-dashboard/attendee-dashboard.component';
import { LocalstorageKeyEnum, RoleEnum } from '../shared';

let SELECTED_FANSPACE_ROLE_ID = localStorage.getItem(LocalstorageKeyEnum.SELECTED_FANSPACE_ROLE_ID);
let redirectRoute = SELECTED_FANSPACE_ROLE_ID && (parseInt(SELECTED_FANSPACE_ROLE_ID) == RoleEnum.MODERATOR) ? 'moderator-dashboard' :'dashboard';

const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: redirectRoute },
      { path: 'moderator-dashboard', component: ModeratorDashboardComponent },
      { path: 'dashboard', component: AttendeeDashboardComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'event-detail/:id', component: EventDetailsComponent },
      { path: 'edit-fanspace', component: EditFanspaceComponent },
      { path: '**', redirectTo: 'not-found' }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class LayoutRoutingModule { }
