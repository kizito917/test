import { NgModule } from "@angular/core";
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EventLayoutComponent } from "./event-layout.component";
import { EventModeratorDashboardComponent } from "./event-moderator-dashboard/event-moderator-dashboard.component";
import { EventLayoutRoutingModule } from "./event-layout-routing.module";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { SharedModule } from "../shared/shared.module";
import { EventAttendeeDashboardComponent } from "./event-attendee-dashboard/event-attendee-dashboard.component";
import { AdvertiseCarouselComponent } from "./advertise-carousel/advertise-carousel.component";
import { CallHistoryComponent } from "./call-history/call-history.component";
import { AttendeeCartComponent } from "./attendee-cart/attendee-cart.component";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { NgxDropzoneModule } from "ngx-dropzone";
import { NgSelectModule } from "@ng-select/ng-select";
import { OwlDateTimeModule, OwlNativeDateTimeModule } from "ng-pick-datetime";
import { IncomingCallComponent } from "./incoming-call/incoming-call.component";
import { DatePipe } from "@angular/common";
import { FeedbackComponent } from "./feedback/feedback.component";
import { WaitingToJoinComponent } from "./waiting-to-join/waiting-to-join.component";
import { LayoutModule } from "../layout/layout.module";
import { LeaveComponentGuard } from "../shared";
import { SideChatComponent } from "./side-chat/side-chat.component";
import { AgoraMediaPlayerComponent } from "./agora-media-player/agora-media-player.component";
import { LiveMediaRendererComponent } from "./live-media-renderer/live-media-renderer.component";
import { LiveQaComponent } from "./live-qa/live-qa.component";
import { SidecallPanelComponent } from './sidecall-panel/sidecall-panel.component';
import { AgoraVideoPlayerComponent } from './agora-video-player/agora-video-player.component';
import { PlayMediaComponent } from "./agora-media-player/play-media/play-media.component";

@NgModule({
  declarations: [
    EventLayoutComponent,
    EventModeratorDashboardComponent,
    EventAttendeeDashboardComponent,
    AdvertiseCarouselComponent,
    CallHistoryComponent,
    AttendeeCartComponent,
    IncomingCallComponent,
    FeedbackComponent,
    WaitingToJoinComponent,
    SideChatComponent,
    LiveQaComponent,
    LiveMediaRendererComponent,
    AgoraMediaPlayerComponent,
    SidecallPanelComponent,
    AgoraVideoPlayerComponent,
    PlayMediaComponent,
  ],
  imports: [
    CommonModule,
    EventLayoutRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
    NgbModule,
    NgxDropzoneModule,
    NgSelectModule,
    OwlDateTimeModule,
    OwlNativeDateTimeModule,
    LayoutModule,
  ],
  providers: [DatePipe, LeaveComponentGuard],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA],
})
export class EventLayoutModule {}
