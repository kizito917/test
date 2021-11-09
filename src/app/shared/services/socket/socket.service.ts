import { Injectable } from "@angular/core";
import * as io from "socket.io-client";
import { environment } from "src/environments/environment";
import {
  LocalstorageKeyEnum,
  SocketEventEnum,
  SocketChannelEnum,
} from "../../enums";
import { BehaviorSubject, interval, Observable, Subscription } from "rxjs";
@Injectable({
  providedIn: "root",
})
export class SocketService {
  private url = `${environment.socketURL}`;
  private socket;
  public statuses = {
    connected: "connected",
    disconnected: "disconnected",
    joined: "joined",
    leaved: "leaved",
  };

  currentConnection: Subscription;
  private socketConnectionState = new BehaviorSubject<any>("");
  castSocketConnectionState = this.socketConnectionState.asObservable();
  constructor() {}

  public connect(namespace) {
    return Observable.create((observer) => {
      if (
        this.socket &&
        this.socket.nsp == `/${namespace}` &&
        this.socket.connected
      ) {
        return this.socket;
      }

      this.socket = io.connect(`${this.url}${namespace}`, {
        query: `token=Bearer ${localStorage.getItem(
          LocalstorageKeyEnum.AUTH_TOKEN
        )}}`,
      });

      this.socket.on("connect", () => {
        if (this.socket.connected) {
          console.log(`${namespace} socket connected from server`);
          observer.next(this.socket);

          this.currentConnection = interval(40000).subscribe((x) => {
            if (this.socket.connected) {
              this.socket.emit("test_socket_connection", "Hello");
              this.listen("test_socket_connection_server").subscribe(
                (message) => {
                  // console.log('test socket message', message);
                }
              );
            }
          });
        } else {
          console.log(`${namespace} socket not connected`);
          console.log(
            `${namespace} socket disconnected from server. Re-triying to connect`
          );
          this.socketConnectionState.next("disconnected");
        }
      });

      this.socket.on("disconnect", () => {
        console.log(`${namespace} socket disconnected from server`);
        // reconnect in 1 sec
        setTimeout(() => {
          console.log(
            `${namespace} socket disconnected from server. Re-triying to connect`
          );
          this.socketConnectionState.next("disconnected");
        }, 1000);
      });

      this.socket.on(SocketEventEnum.SOCKET_CONNECTION_STATUS, (message) => {
        if (message && message.status === this.statuses.connected) {
          console.log(`${namespace} socket connected server side`);
          observer.next(message);
        } else {
          console.log(`${namespace} socket not connected server side`);
        }
      });
    });
  }

  public joinRoom(room) {
    console.log("join room called", room);

    return Observable.create((observer) => {
      this.socket.emit(SocketChannelEnum.JOIN_ROOM, room);

      this.socket.on(SocketEventEnum.ROOM_JOINED, () => {
        console.log("successfully joined room ", room);

        observer.next("room joined");
        observer.complete();
      });
    });
  }

  public leaveRoom(room) {
    console.log("leave room called", room);
    this.socket.emit(SocketChannelEnum.LEAVE_ROOM, room);
  }

  public emit(socket_event, message) {
    this.socket.emit(socket_event, message);
  }

  public listen(socket_event) {
    return Observable.create((observer) => {
      console.log("listening to ", socket_event);

      this.socket.on(socket_event, (message) => {
        //console.log("listened =============>",message);

        observer.next(message);
      });
    });
  }

  public removeListener(socket_event) {
    this.socket.off(socket_event);
  }
}
