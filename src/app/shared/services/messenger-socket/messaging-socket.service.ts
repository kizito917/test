import { Injectable } from '@angular/core';
import { SocketService } from '../socket/socket.service';
import { LocalstorageKeyEnum, SocketNamespaceEnum, SocketEventEnum, SocketChannelEnum } from '../../enums';
import { MakeMessageSeenInterface } from '../../interfaces';

@Injectable({
  providedIn: 'root'
})
export class MessengerSocketService extends SocketService {

  constructor() {
    console.log('MessengerSocketService constructor called.');
    super();
  }

  public connect() {
    return super.connect(SocketNamespaceEnum.MESSENGER);
  }

  public makeMessagesSeen(makeMessageSeen: MakeMessageSeenInterface) {
    //const msg = Object.assign(
    //  { token: localStorage.getItem(LocalstorageKeyEnum.AUTH_TOKEN) },
    //  message
    //);
    return super.emit(SocketChannelEnum.MAKE_MESSAGE_SEEN, makeMessageSeen);
  }

  public listenToReceiveNewMessenger() {
    return super.listen(SocketEventEnum.RECEIVE_NEW_MESSENGER);
  }

  public listenToReceiveMessage() {
    return super.listen(SocketEventEnum.RECEIVE_MESSAGE);
  }

}
