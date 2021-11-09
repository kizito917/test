import { Component, Input, OnInit } from '@angular/core';
import { AgoraRtcStreamHandlerService } from '../../services/agora/agora-rtc-stream-handler.service';

@Component({
  selector: 'app-notification-tooltip',
  templateUrl: './notification-tooltip.component.html',
  styleUrls: ['./notification-tooltip.component.scss']
})
export class NotificationTooltipComponent implements OnInit {
@Input() isModerator:boolean;
  constructor( public agoraStreamHandler: AgoraRtcStreamHandlerService) { }
 public isRender: boolean = false;
  ngOnInit(): void {
    setTimeout(() => {
      this.isRender=true;
    }, 4000);
  
  }
  deactivate(){
    this.isRender=false;
  }
}
