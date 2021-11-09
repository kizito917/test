import { Injectable } from "@angular/core";
import { SocketService } from "../socket/socket.service";
import {
  LocalstorageKeyEnum,
  SocketNamespaceEnum,
  SocketEventEnum,
  SocketChannelEnum,
  SideCallEnum,
} from "../../enums";
import { Observable } from "rxjs";
import { BroadcastStreamingContent } from "../../interfaces";

@Injectable({
  providedIn: "root",
})
export class EventSocketService extends SocketService {
  constructor() {
    //console.log('EventSocketService constructor called.');
    super();
  }

  public connect() {
    return super.connect(SocketNamespaceEnum.EVENT);
  }

  //public emit(message) {
  //  const msg = Object.assign(
  //    { token: localStorage.getItem(LocalstorageKeyEnum.AUTH_TOKEN) },
  //    message
  //  );
  //  return super.emit('send-message', msg);
  //}

  public broadcastLiveEventState(data: BroadcastStreamingContent) {
    console.log("Live Event State Change called", data);

    return Observable.create((observer) => {
      this.emit(SocketChannelEnum.BROADCAST_CURRENT_STREAMING_CONTENT, data);
    });
  }

  public listenCurrentStreamingContentChanged() {
    return super.listen(SocketEventEnum.CURRENT_STREAMING_CONTENT_CHANGED);
  }

  public listenEventStarted() {
    return super.listen(SocketEventEnum.EVENT_STARTED);
  }

  public listenEventEnded() {
    return super.listen(SocketEventEnum.EVENT_ENDED);
  }

  public listenAttendeeProfileCardBannerChanged() {
    return super.listen(SocketEventEnum.ATTENDEE_PROFILE_CARD_BANNER_CHANGED);
  }

  public listenAdvertiseCarouselBannerChanged() {
    return super.listen(SocketEventEnum.ADVERTISE_CAROUSEL_BANNER_CHANGED);
  }

  public listenAdvertiseCarouselSettingChanged() {
    return super.listen(SocketEventEnum.ADVERTISE_CAROUSEL_SETTING_CHANGED);
  }

  public listenAdvertiseCarouselBannerDeleted() {
    return super.listen(SocketEventEnum.ADVERTISE_CAROUSEL_BANNER_DELETED);
  }

  public listenAdvertiseCarouselBannerAdded() {
    return super.listen(SocketEventEnum.ADVERTISE_CAROUSEL_BANNER_ADDED);
  }

  public listenEventJoined() {
    return super.listen(SocketEventEnum.EVENT_JOINED);
  }

  public listenEventLeaved() {
    return super.listen(SocketEventEnum.EVENT_LEAVED);
  }

  public listenReceiveLiveChatMessage() {
    return super.listen(SocketEventEnum.RECEIVE_LIVE_CHAT_MESSAGE);
  }

  public listenParticipantSceneChange(user_id) {
    return super.listen(user_id);
  }

  public sendParticipantSceneChange(data) {
    this.emit(SocketChannelEnum.NOTIFY_SCENE_CHANGE, data);
  }
  public listenAvailableForSidechat() {
    return super.listen(SocketEventEnum.AVAILABLE_FOR_SIDECHAT);
  }

  public listenUserProfileImageChanged() {
    return super.listen(SocketEventEnum.USER_PROFILE_IMAGE_CHANGED);
  }

  public listenUserProfileDataChanged() {
    return super.listen(SocketEventEnum.USER_PROFILE_DATA_CHANGED);
  }

  public listenEventLiveChatChanged() {
    return super.listen(SocketEventEnum.EVENT_LIVE_CHAT_CHANGED);
  }

  public listenEventSideChatAudioChanged() {
    return super.listen(SocketEventEnum.EVENT_SIDE_CHAT_AUDIO_CHANGED);
  }

  public listenEventSideChatVideoChanged() {
    return super.listen(SocketEventEnum.EVENT_SIDE_CHAT_VIDEO_CHANGED);
  }

  public listenSideCallInvitation() {
    return super.listen(SideCallEnum.SIDECALL_INCOMING);
  }

  public listenSideCallCancel() {
    return super.listen(SideCallEnum.SIDECALL_CANCEL);
  }

  public listenCallAccepted() {
    return super.listen(SideCallEnum.SIDECALL_ACCEPT);
  }

  public listenCallDecline() {
    return super.listen(SideCallEnum.SIDECALL_DECLINE);
  }

  public listenSideCallTimeout() {
    return super.listen(SideCallEnum.SIDECALL_TIMEOUT);
  }

  public listenOnSidechatCall() {
    return super.listen('on_sidechat_call');
  }

  public listenOffSidechatCall() {
    return super.listen('off_sidechat_call');
  }

  public listenLockSidechatCall() {
    return super.listen('lock_sidechat_call');
  }

  public listenAvailableForLiveQA() {
    return super.listen(SocketEventEnum.AVAILABLE_FOR_LIVEQA);
  }
  
  public listenDeactivateEventUser() {
    return super.listen(SocketEventEnum.EVENT_USER_DEACTIVATED);
  }

  public listenBlockUnblockUser() {
    return super.listen(SocketEventEnum.BLOCK_USER_CHANGED);
  }

  public listenAdvertiseCarouselBannerRedirectUrlChanged() {
    return super.listen(SocketEventEnum.ADVERTISE_CAROUSEL_BANNER_REDIRECT_URL_CHANGED);
  }
}
