import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { getHttpHeaderOptions } from '../header';
import { UserInterface } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private httpClient: HttpClient) { }

  public saveUserFullName(data) {
    return this.httpClient.put(`${environment.apiURL}user/update-name`, data, getHttpHeaderOptions());
  }

  public getConnectedFanspaces() {
    return this.httpClient.get(`${environment.apiURL}user/connected-fanspaces`, getHttpHeaderOptions());
  }

  public updateUserProfile(data) {
    return this.httpClient.put(`${environment.apiURL}user`, data, getHttpHeaderOptions());
  }

  public getUserDetails() {
    return this.httpClient.get(`${environment.apiURL}user`, getHttpHeaderOptions());
  }

  public updateTagline(data) {
    return this.httpClient.put(`${environment.apiURL}user/update-tagline`, data, getHttpHeaderOptions());
  }

  public changeProfilePicture(data, id) {
    return this.httpClient.put(`${environment.apiURL}user/change-profile-picture/${id}`, data, getHttpHeaderOptions());
  }

  
}
