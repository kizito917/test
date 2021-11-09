import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { AgoraRtcStreamHandlerService } from 'src/app/shared';

@Component({
  selector: 'app-call-history',
  templateUrl: './call-history.component.html',
  styleUrls: ['./call-history.component.scss']
})
export class CallHistoryComponent implements OnInit {

  @Input() callType: number;
  @Input() is_incoming_call: boolean;
  @Input() caller_info: any;
  @Input() caller_loading: boolean;
  @Input() timer:number;
  @Input() callButtonLoader: boolean;
  @Output() acceptSideCall = new EventEmitter();
  @Output() declineSideCall = new EventEmitter()
  @Output() navigateToMessenger =  new EventEmitter()

  constructor(public agoraStreamHandler:AgoraRtcStreamHandlerService) { }

  ngOnInit(): void {
  }

  openMessenger(){
    this.handleDeclineSideCall()
    this.navigateToMessenger.emit()
  }

  handleAcceptSideCall() {
    this.acceptSideCall.emit();
  }

  handleDeclineSideCall() {
    this.declineSideCall.emit();
  }

}
