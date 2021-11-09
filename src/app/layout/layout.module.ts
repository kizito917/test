import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { LayoutComponent } from "./layout.component";
import { LayoutRoutingModule } from "./layout-routing.module";
import { SharedModule } from "../shared/shared.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { LeftMenuSidebarComponent } from "./left-menu-sidebar/left-menu-sidebar.component";
import { EventSidebarComponent } from "./event-sidebar/event-sidebar.component";
import { ProfileSidebarComponent } from "./profile-sidebar/profile-sidebar.component";
import { ModeratorDashboardComponent } from "./moderator-dashboard/moderator-dashboard.component";
import { ProfileComponent } from "./profile/profile.component";
import { EventDetailsComponent } from "./event-details/event-details.component";
//import { NgxPaginationModule } from 'ngx-pagination';
//import { Ng2SearchPipeModule } from 'ng2-search-filter';
import { NgSelectModule } from "@ng-select/ng-select";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
import { EmojiModule } from "@ctrl/ngx-emoji-mart/ngx-emoji";
import { EditFanspaceComponent } from "./edit-fanspace/edit-fanspace.component";
import { NgxDropzoneModule } from "ngx-dropzone";
import { AttendeeDashboardComponent } from "./attendee-dashboard/attendee-dashboard.component";
import { DatePipe } from "@angular/common";

import { MediaInputOutputCheckComponent } from "../shared/components/media-input-output-check/media-input-output-check.component";

@NgModule({
  declarations: [
    LayoutComponent,
    LeftMenuSidebarComponent,
    EventSidebarComponent,
    ProfileSidebarComponent,
    ModeratorDashboardComponent,
    ProfileComponent,
    EventDetailsComponent,
    EditFanspaceComponent,
    AttendeeDashboardComponent,
    //  MediaInputOutputCheckComponent,
  ],
  imports: [
    CommonModule,
    LayoutRoutingModule,
    NgbModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgSelectModule,
    PickerModule,
    EmojiModule,
    NgxDropzoneModule,
    //Ng2Charts,
    //NgxPaginationModule,
    //Ng2SearchPipeModule
  ],
  exports: [LeftMenuSidebarComponent],
  providers: [DatePipe],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class LayoutModule {}
