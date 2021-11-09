import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
//import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { RouterModule } from "@angular/router";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

import { ControlContainerComponent } from "./components/control-container/control-container.component";
import { FormSubmissionListenerDirective } from "./components/control-container/control-container-form.directive";
import { ControlContainerSubmissionService } from "./components/control-container/control-container-submission.service";
import { ValidationService } from "./validators/validation.service";
import { ActionSelectorComponent } from "./components/action-selector/action-selector.component";
import { PhoneCodeSelectorComponent } from "./components/phone-code-selector/phone-code-selector.component";
import { DateFormatPipe } from "./pipes/date-format/date-format.pipe";
import { BreckLinePipe } from "./pipes/breck-line/breck-line.pipe";
import { NgOtpInputModule } from "ng-otp-input";
import { FirstLetterPipe } from "./pipes/first-letter/first-letter.pipe";
import { LoadingComponent } from "./components/loading/loading.component";
import { DurationSelectorComponent } from "./components/duration-selector/duration-selector.component";
import { TaglineInputComponent } from "./components/tagline-input/tagline-input.component";
import { PickerModule } from "@ctrl/ngx-emoji-mart";
import { LimitPipe } from "./pipes/limit/limit.pipe";
import { ProfileDetaiModalComponent } from "./components/profile-detail-modal/profile-detail-modal.component";
import { NgSelectModule } from "@ng-select/ng-select";
import { ProfileImgModalComponent } from "./components/profile-img-modal/profile-img-modal.component";
import { YoutubePlayerComponent } from "./components/youtube-player/youtube-player.component";
import { YouTubePlayerModule } from "@angular/youtube-player";
import { MediaInputOutputCheckComponent } from "./components/media-input-output-check/media-input-output-check.component";
import { MediaControlComponent } from "./components/media-control/media-control.component";
import { AudioBalancerComponent } from "./components/audio-balancer/audio-balancer.component";
import { TooltipComponent } from "./components/tooltip/tooltip.component";
import { InfoNativeTooltipComponent } from "./components/info-native-tooltip/info-native-tooltip.component";
import { AskUserGuestureComponent } from "./components/ask-user-guesture/ask-user-guesture.component";
import { CarouselUrlInputComponent } from "./components/carousel-url-input/carousel-url-input.component";
import { EmojiMartComponent } from "./components/emoji-mart/emoji-mart.component";
import { SidecallMediaControlsComponent } from './components/sidecall-media-controls/sidecall-media-controls.component';
import { NotificationTooltipComponent } from './components/notification-tooltip/notification-tooltip.component';
import { Html5PlayerComponent } from './components/html5-player/html5-player.component';

@NgModule({
  declarations: [
    ControlContainerComponent,
    FormSubmissionListenerDirective,
    ActionSelectorComponent,
    PhoneCodeSelectorComponent,
    DateFormatPipe,
    BreckLinePipe,
    FirstLetterPipe,
    LoadingComponent,
    DurationSelectorComponent,
    TaglineInputComponent,
    LimitPipe,
    YoutubePlayerComponent,
    ProfileDetaiModalComponent,
    ProfileImgModalComponent,
    MediaInputOutputCheckComponent,
    MediaControlComponent,
    AudioBalancerComponent,
    TooltipComponent,
    InfoNativeTooltipComponent,
    AskUserGuestureComponent,
    CarouselUrlInputComponent,
    EmojiMartComponent,
    SidecallMediaControlsComponent,
    NotificationTooltipComponent,
    Html5PlayerComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    //NgbModule,
    NgOtpInputModule,
    PickerModule,
    YouTubePlayerModule,
    NgSelectModule,
  ],
  exports: [
    ControlContainerComponent,
    FormSubmissionListenerDirective,
    ActionSelectorComponent,
    PhoneCodeSelectorComponent,
    DateFormatPipe,
    BreckLinePipe,
    NgOtpInputModule,
    FirstLetterPipe,
    LoadingComponent,
    TaglineInputComponent,
    LimitPipe,
    YoutubePlayerComponent,
    MediaInputOutputCheckComponent,
    MediaControlComponent,
    AudioBalancerComponent,
    TooltipComponent,
    InfoNativeTooltipComponent,
    AskUserGuestureComponent,
    CarouselUrlInputComponent,
    EmojiMartComponent,
    SidecallMediaControlsComponent,
    NotificationTooltipComponent,
    Html5PlayerComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [ControlContainerSubmissionService],
})
export class SharedModule {
  static forRoot() {
    return {
      ngModule: SharedModule,
      providers: [
        ValidationService,
        //AsyncValidationService
      ],
    };
  }
}
