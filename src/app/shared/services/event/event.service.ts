import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import { getHttpHeaderOptions } from "../header";

@Injectable({
  providedIn: "root",
})
export class EventService {
  constructor(private httpClient: HttpClient) {}

  public addEvent(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/add`,
      data,
      getHttpHeaderOptions()
    );
  }

  public getAllEvents(data) {
    return this.httpClient.get(
      `${environment.apiURL}event/all/${data}`,
      getHttpHeaderOptions()
    );
  }

  public getEventById(data) {
    return this.httpClient.get(
      `${environment.apiURL}event/by-id/${data}`,
      getHttpHeaderOptions()
    );
  }

  public addEventGuest(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/add-guest-user`,
      data,
      getHttpHeaderOptions()
    );
  }

  public getGuestsByEventId(id) {
    return this.httpClient.get(
      `${environment.apiURL}event/guest-users/${id}`,
      getHttpHeaderOptions()
    );
  }

  public updateGuestSetting(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/update-guest-setting`,
      data,
      getHttpHeaderOptions()
    );
  }
  public deleteGuest(id) {
    return this.httpClient.delete(
      `${environment.apiURL}event/delete-guest-user/${id}`,
      getHttpHeaderOptions()
    );
  }

  public publishUnpublishEvent(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/publish-unpublish/`,
      data,
      getHttpHeaderOptions()
    );
  }

  public deleteEvent(id) {
    return this.httpClient.delete(
      `${environment.apiURL}event/delete/${id}`,
      getHttpHeaderOptions()
    );
  }

  public getEventDetails(event_code) {
    return this.httpClient.get(
      `${environment.apiURL}event/details/${event_code}`,
      getHttpHeaderOptions()
    );
  }

  public addUpdateEventDetails(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/add-update-event-details`,
      data,
      getHttpHeaderOptions()
    );
  }

  public allowDisallowParticipantAudio(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/allow-disallow-participant-audio`,
      data,
      getHttpHeaderOptions()
    );
  }

  public allowDisallowParticipantVideo(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/allow-disallow-participant-video`,
      data,
      getHttpHeaderOptions()
    );
  }
  public allowDisallowParticipantSidechat(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/allow-disallow-participant-sidechat`,
      data,
      getHttpHeaderOptions()
    );
  }
  public allowDisallowParticipantSidechatVideo(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/allow-disallow-participant-sidechat-video`,
      data,
      getHttpHeaderOptions()
    );
  }
  public allowDisallowLiveChat(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/allow-disallow-live-chat`,
      data,
      getHttpHeaderOptions()
    );
  }

  public addEventVisuals(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/add-event-visuals`,
      data,
      getHttpHeaderOptions()
    );
  }

  public addAdvertiseCarouselBanners(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/add-advertise-carousel-banners`,
      data,
      getHttpHeaderOptions()
    );
  }

  public updateAdvertiseCarouselSetting(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/add-update-event-carousel-settings`,
      data,
      getHttpHeaderOptions()
    );
  }

  public deleteEventVisaul(id) {
    return this.httpClient.delete(
      `${environment.apiURL}event/delete-event-visual/${id}`,
      getHttpHeaderOptions()
    );
  }

  public deleteAdvertiseCarouselBanner(id) {
    return this.httpClient.delete(
      `${environment.apiURL}event/delete-advertise-carousel-banner/${id}`,
      getHttpHeaderOptions()
    );
  }

  public startEvent(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/start`,
      data,
      getHttpHeaderOptions()
    );
  }

  public checkEventStatus(event_code) {
    return this.httpClient.get(
      `${environment.apiURL}event/check-status/${event_code}`,
      getHttpHeaderOptions()
    );
  }

  public joinEvent(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/join`,
      data,
      getHttpHeaderOptions()
    );
  }

  public endEvent(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/end`,
      data,
      getHttpHeaderOptions()
    );
  }

  public leaveEvent(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/leave`,
      data,
      getHttpHeaderOptions()
    );
  }

  public getEventAttendeeDashboardDetails(event_code) {
    return this.httpClient.get(
      `${environment.apiURL}event/attendee-dashboard-details/${event_code}`,
      getHttpHeaderOptions()
    );
  }

  public setUnsetVisual(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/set-unset-visual`,
      data,
      getHttpHeaderOptions()
    );
  }

  public setUnsetAdvertiseCarouselBanner(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/set-unset-advertise-carousel-banner`,
      data,
      getHttpHeaderOptions()
    );
  }

  public getAttendeeProfile(userId, eventId) {
    return this.httpClient.get(
      `${environment.apiURL}event/attendee-profile/${userId}/${eventId}`,
      getHttpHeaderOptions()
    );
  }

  public getEventLiveChat(event_id) {
    return this.httpClient.get(
      `${environment.apiURL}event/live-chat/${event_id}`,
      getHttpHeaderOptions()
    );
  }

  public sendLiveChatMessage(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/send-live-chat-message`,
      data,
      getHttpHeaderOptions()
    );
  }

  public copyEvent(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/copy`,
      data,
      getHttpHeaderOptions()
    );
  }

  public addEventLiveMedia(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/add-event-live-media-content`,
      data,
      getHttpHeaderOptions()
    );
  }
  public updateEventLiveMedia(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/update-event-live-media-content`,
      data,
      getHttpHeaderOptions()
    );
  }
  public deleteEventLiveMedia(id) {
    return this.httpClient.delete(
      `${environment.apiURL}event/delete-live-media-content/${id}`,
      getHttpHeaderOptions()
    );
  }

  public toggleEventFavoriteParticipants(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/make-it-favorite`,
      data,
      getHttpHeaderOptions()
    );
  }

  public changeParticipantLiveQAStatus(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/change-live-qanda-state`,
      data,
      getHttpHeaderOptions()
    );
  }

  public availableForSidechat(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/available-for-sidechat`,
      data,
      getHttpHeaderOptions()
    );
  }

  public bookmarkUser(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/bookmark-user`,
      data,
      getHttpHeaderOptions()
    );
  }

  public removeUserBookmark(bookmarkId) {
    return this.httpClient.delete(
      `${environment.apiURL}event/remove-user-bookmark/${bookmarkId}`,
      getHttpHeaderOptions()
    );
  }

  public getBookmarkUsers() {
    return this.httpClient.get(
      `${environment.apiURL}event/bookmark-user`,
      getHttpHeaderOptions()
    );
  }

  public startSideChatCall(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/start-sidechat-call`,
      data,
      getHttpHeaderOptions()
    );
  }

  public joinSideChatCall(data) {
    return this.httpClient.post(
      `${environment.apiURL}event/join-existing-sidechat-call`,
      data,
      getHttpHeaderOptions()
    );
  }

  public cancelSideChatCall(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/cancel-sidechat-call`,
      data,
      getHttpHeaderOptions()
    );
  }

  public acceptSideChatCall(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/sidechat-call-accepted`,
      data,
      getHttpHeaderOptions()
    );
  }

  public declineSideChatCall(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/sidechat-call-decline`,
      data,
      getHttpHeaderOptions()
    );
  }

  public timeOutSideChatCall(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/receiver-sidechat-call-timeout`,
      data,
      getHttpHeaderOptions()
    );
  }

  public endSideChatCall(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/leave-or-end-sidechat-call`,
      data,
      getHttpHeaderOptions()
    );
  }

  public lockSideChatCall(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/lock-sidechat-call`,
      data,
      getHttpHeaderOptions()
    );
  }

  public toggleRaiseHand(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/raise-or-lower-hand`,
      data,
      getHttpHeaderOptions()
    );
  }

  public deactivateUser(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/deactivate-user`,
      data,
      getHttpHeaderOptions()
    );
  }

  public blockUnblockUser(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/block-unblock-user`,
      data,
      getHttpHeaderOptions()
    );
  }

  public updateCarouselBannerRedirectUrl(data) {
    return this.httpClient.put(
      `${environment.apiURL}event/update-carousel-banner-redirect-url`,
      data,
      getHttpHeaderOptions()
    );
  }
}
