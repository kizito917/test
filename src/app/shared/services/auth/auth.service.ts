import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders, HttpRequest } from "@angular/common/http";
import { environment } from "src/environments/environment";
import { getUserFromLocalStorage } from "../localstorage-user";
import { LocalstorageKeyEnum } from "../../enums";
import { getHttpHeaderOptions } from "../header";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  constructor(private httpClient: HttpClient) {}

  public isLoggedIn() {
    let user = getUserFromLocalStorage();
    let token = localStorage.getItem(LocalstorageKeyEnum.AUTH_TOKEN);
    if (user && token) {
      return true;
    } else {
      return false;
    }
  }

  public verifyPasscode(data) {
    return this.httpClient.post(
      `${environment.apiURL}auth/verify-passcode`,
      data
    );
  }

  public signin(data) {
    return this.httpClient.post(`${environment.apiURL}auth/signin`, data);
  }

  public signup(data) {
    return this.httpClient.post(`${environment.apiURL}auth/signup`, data);
  }

  public getAgoraToken(channelId, userId) {
    try {
      return this.httpClient
        .get<any>(
          `${environment.apiURL}agora/token/${channelId}/${userId}`,
          getHttpHeaderOptions()
        )
        .toPromise()
        .then((res) => {
          if (res?.is_success) {
            return res?.data?.token;
          }
        })
        .catch((err) => err);
    } catch (error) {
      console.log("token generation error", error);
    }
  }

  public getAgoraSideCallToken(channelId, userId) {
    try {
      return this.httpClient
        .get<any>(
          `${environment.apiURL}agora/sidechat-token/${channelId}/${userId}`,
          getHttpHeaderOptions()
        )
        .toPromise()
        .then((res) => {
          if (res?.is_success) {
            return res?.data?.token;
          }
        })
        .catch((err) => err);
    } catch (error) {
      console.log("token generation error", error);
    }
  }
}
