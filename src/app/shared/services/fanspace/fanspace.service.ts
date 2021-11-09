import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { getHttpHeaderOptions } from '../header';

@Injectable({
  providedIn: 'root'
})
export class FanspaceService {

  constructor(private httpClient: HttpClient) { }

  public createFanspace(data) {
    return this.httpClient.post(`${environment.apiURL}fanspace/add`, data, getHttpHeaderOptions());
  }

  public getFanspaceDetails(id) {
    return this.httpClient.get(`${environment.apiURL}fanspace/details/${id}`, getHttpHeaderOptions());
  }

  public updateFanspace(data, id) {
    return this.httpClient.put(`${environment.apiURL}fanspace/edit/${id}`, data, getHttpHeaderOptions());
  }

  public changeFanspaceLogo(data, id) {
    return this.httpClient.put(`${environment.apiURL}fanspace/change-fanspace-logo/${id}`, data, getHttpHeaderOptions());
  }

  public uploadHeroImage(data, id) {
    return this.httpClient.put(`${environment.apiURL}event/upload-event-page-image/${id}`, data, getHttpHeaderOptions());
  }

}
