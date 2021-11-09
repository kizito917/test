import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-info-native-tooltip',
  templateUrl: './info-native-tooltip.component.html',
  styleUrls: ['./info-native-tooltip.component.scss']
})
export class InfoNativeTooltipComponent implements OnInit {
  @Input() data:string

  constructor() { 
  }

  ngOnInit(): void {
  }

}
 