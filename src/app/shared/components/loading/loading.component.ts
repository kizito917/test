import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: '[loadinga]',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss']
})
export class LoadingComponent implements OnInit {
  
  @Input() loader_img:string = '/assets/image/page_loader.svg';
  @Input() loaderClass:string = 'page_loader_image'
  constructor() { }

  ngOnInit(): void {
  }

}
