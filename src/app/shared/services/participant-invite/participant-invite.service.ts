import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { getHttpHeaderOptions } from '../header';

@Injectable({
    providedIn: 'root'
})
export class ParticipantInviteService {

    constructor(private httpClient: HttpClient) { }

    public verifyEventInviteLink(data) {
      return this.httpClient.post(`${environment.apiURL}auth/validate-event-invite-link`, data);
    }

    public participantJoinFanspace(data) {
      return this.httpClient.post(`${environment.apiURL}auth/participant-join-fanspace`, data);
    }
  
    public joinFanspace(data) {
      return this.httpClient.post(`${environment.apiURL}user/join-fanspace`, data, getHttpHeaderOptions());
    }
}
