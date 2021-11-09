import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { getHttpHeaderOptions } from '../header';

@Injectable({
  providedIn: 'root'
})
export class MessengerService {

  constructor(private httpClient: HttpClient) { }

  public sendMessage(data) {
    return this.httpClient.post(`${environment.apiURL}messenger/send-message`, data, getHttpHeaderOptions());
  }

  public getMessengers() {
    return this.httpClient.get(`${environment.apiURL}messenger/list`, getHttpHeaderOptions());
  }

  public getMessengerConversation(receiverId, eventId) {
    return this.httpClient.get(`${environment.apiURL}messenger/conversation/${receiverId}/${eventId}`, getHttpHeaderOptions());
  }
}
