import { Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DataShareService {

  constructor() { }

  private newEvent = new BehaviorSubject<any>('');
  castNewEvent = this.newEvent.asObservable();

  private fanspace = new BehaviorSubject<any>('');
  castFanspace = this.fanspace.asObservable();

  private deletedEventId = new BehaviorSubject<any>('');
  castDeletedEventId = this.deletedEventId.asObservable();

  private events = new BehaviorSubject<any>('');
  castEvents = this.events.asObservable();

  private publishedEvent = new BehaviorSubject<any>('');
  castpublishedEvent = this.publishedEvent.asObservable();

  private access = new BehaviorSubject<any>('');
  castAccess = this.access.asObservable();

  private user = new BehaviorSubject<any>('');
  castUser = this.user.asObservable();

  private profilePicture = new BehaviorSubject<any>('');
  castProfilePicture = this.profilePicture.asObservable();

  private eventStatus = new BehaviorSubject<any>('');
  castEventStatus = this.eventStatus.asObservable();

  private newParticipant = new BehaviorSubject<any>('');
  castNewParticipant = this.newParticipant.asObservable();

  private availableForSidechat = new BehaviorSubject<any>('');
  castAvailableForSidechat = this.availableForSidechat.asObservable();

  private userProfileImage = new BehaviorSubject<any>('');
  castUserProfileImage = this.userProfileImage.asObservable();

  private userProfileData = new BehaviorSubject<any>('');
  castUserProfileData = this.userProfileData.asObservable();

  private eventLiveChat = new BehaviorSubject<any>('');
  castEventLiveChat = this.eventLiveChat.asObservable();

  private eventSideChatAudio = new BehaviorSubject<any>('');
  castEventSideChatAudio = this.eventSideChatAudio.asObservable();

  private eventSideChatVideo = new BehaviorSubject<any>('');
  castEventSideChatVideo = this.eventSideChatVideo.asObservable();

  private eventParticipants = new BehaviorSubject<any>('');
  castEventParticipants = this.eventParticipants.asObservable();

  private lockSideChatRoom = new BehaviorSubject<any>('');
  castLockSideChatRoom = this.lockSideChatRoom.asObservable();

  private onSideChatRoom = new BehaviorSubject<any>('');
  castOnSideChatRoom = this.onSideChatRoom.asObservable();

  private offSideChatRoom = new BehaviorSubject<any>('');
  castOffSideChatRoom = this.offSideChatRoom.asObservable();

  addedNewEvent(newEvent) {
    this.newEvent.next(newEvent); 
   }

  updatedFanspace(fanspace) {
    this.fanspace.next(fanspace); 
   }

  deletedEventById(id) {
    this.deletedEventId.next(id); 
   }

  gotAllEvents(events){
      this.events.next(events); 
   }

  publishedNewEvent(event) {
    this.publishedEvent.next(event); 
   }

  updatedAccess(access){
     this.access.next(access); 
   }

  updatedUserDetails(user) {
    this.user.next(user);
  }

  changedProfilePicture(picture) {
    this.profilePicture.next(picture);
  }

  changedEventStatus(eventStatus) {
    //console.log('changedEventStatus =========>', eventStatus);
    this.eventStatus.next(eventStatus);
  }

  joinedNewParticipant(participant) {
    //console.log('joinedNewParticipant =========>', participant);
    this.newParticipant.next(participant);
  }

  complete() {
    this.eventStatus.complete();
    this.newParticipant.complete();
  }

  changedAvailableForSidechat(data) {
    this.availableForSidechat.next(data);
  }

  changedUserProfileImage(data) {
    this.userProfileImage.next(data);
  }

  changedUserProfileData(data) {
    this.userProfileData.next(data);
  }

  changedEventLiveChat(data) {
    this.eventLiveChat.next(data);
  }

  changedEventSideChatAudio(data) {
    this.eventSideChatAudio.next(data);
  }

  changedEventSideChatVideo(data) {
    this.eventSideChatVideo.next(data);
  }

  changedEventParticipants(data) {
    this.eventParticipants.next(data);
  }

  changedLockSideChatRoom(data) {
    this.lockSideChatRoom.next(data);
  }

  changedOnSideChatCall(data) {
    this.onSideChatRoom.next(data);
  }

  changedOffSideChatCall(data) {
    this.offSideChatRoom.next(data);
  }

}
