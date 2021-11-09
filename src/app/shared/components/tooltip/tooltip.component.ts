import { Component, Input, OnInit } from '@angular/core';
import { AgoraRtcStreamHandlerService } from '../../services';

@Component({
  selector: 'app-tooltip',
  templateUrl: './tooltip.component.html',
  styleUrls: ['./tooltip.component.scss']
})
export class TooltipComponent implements OnInit {
  @Input() type:string = 'info';
  @Input() pos:string = 'left';
  @Input() heading:string;
  @Input() subHeading:string;
  @Input() cross:boolean = false;

  constructor(private agoraRTCStreamHandler: AgoraRtcStreamHandlerService) {
   }

  ngOnInit(): void {
  }

  onCloseTooltip(){
    this.agoraRTCStreamHandler.setHoldStateData(false, true)
  }

}
