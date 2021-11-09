import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './shared';
import { LayoutModule } from './layout/layout.module';
import { LoginModule } from './login/login.module';
import { ServerErrorModule } from './server-error/server-error.module';
import { AccessDeniedModule } from './access-denied/access-denied.module';
import { NotFoundModule } from './not-found/not-found.module';
import { EventLayoutModule } from './event-layout/event-layout.module';
import { RegistrationModule } from './registration/registration.module';
import { ParticipantInviteModule } from './participant-invite/participant-invite.module';
import { WhatsYourNameModule } from './whats-your-name/whats-your-name.module';
import { WhatWeCallYourFanspaceModule } from './what-we-call-your-fanspace/what-we-call-your-fanspace.module';
import { SelectFanspaceModule } from './select-fanspace/select-fanspace.module';
import { ContactUsModule } from './contact-us/contact-us.module';
import { PrivacyPolicyModule } from './privacy-policy/privacy-policy.module';
import { TermsAndConditionsModule } from './terms-and-conditions/terms-and-conditions.module';


const routes: Routes = [
  { path: '', loadChildren: () => LayoutModule, canActivate: [AuthGuard]},
  { path: 'event', loadChildren: () => EventLayoutModule, canActivate: [AuthGuard] },
  { path: 'whats-your-name', loadChildren: () => WhatsYourNameModule, canActivate: [AuthGuard] },
  { path: 'what-we-call-your-fanspace', loadChildren: () => WhatWeCallYourFanspaceModule, canActivate: [AuthGuard] },
  { path: 'select-fanspace', loadChildren: () => SelectFanspaceModule, canActivate: [AuthGuard] },
  { path: 'signup', loadChildren: () => RegistrationModule },
  { path: 'login', loadChildren: () => LoginModule },
  { path: 'invite', loadChildren: () => ParticipantInviteModule },
  { path: 'contact-us', loadChildren: () => ContactUsModule },
  { path: 'privacy-policy', loadChildren: () => PrivacyPolicyModule },
  { path: 'terms-and-conditions', loadChildren: () => TermsAndConditionsModule },
  { path: 'error', loadChildren: () => ServerErrorModule },
  { path: 'access-denied', loadChildren: () => AccessDeniedModule },
  { path: 'not-found', loadChildren: () => NotFoundModule },
  { path: '**', redirectTo: 'not-found' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
