import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { environment } from 'src/environments/environment';
import { catchError, retry, } from 'rxjs/operators';
import { getHttpHeaderOptions } from '../header';

@Injectable({
  providedIn: 'root'
})
export class CommonService {

  constructor(private httpClient: HttpClient) { }

  public getCountries() {
    return this.httpClient.get(`${environment.apiURL}country`);
  }

  public searchZipcode(data) {
    return this.httpClient.post(`${environment.apiURL}user/zipcode`, data, getHttpHeaderOptions());

    //return this.httpClient.get('/assets/data/zipcode-new.json')
  }

}
