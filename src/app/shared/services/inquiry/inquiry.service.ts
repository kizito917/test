import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { getHttpHeaderOptions } from '../header';

@Injectable({
  providedIn: 'root'
})
export class InquiryService {
  constructor(private httpClient: HttpClient) { }

  public addInquiry(data) {
    return this.httpClient.post(`${environment.apiURL}inquiry/add`,data,getHttpHeaderOptions());
  }
  
  public addSubscription(data) {
    return this.httpClient.post(`${environment.apiURL}inquiry/subscription`,data,getHttpHeaderOptions());
  }
}
