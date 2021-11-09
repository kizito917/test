import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit {

  //pushbody: string = "sidebar-left-close";
  //pushwrapper: string = "p-0";

  constructor() { }

  ngOnInit() {
    //const dom: Element = document.querySelector('body');
    
    //window.onresize = function (event) {
    //  if (window.innerWidth <= 992) {
    //    dom.classList.add('sidebar-left-close');
    //  } else {
    //    dom.classList.remove('sidebar-left-close');
    //  }
    //};

    //if (window.innerWidth <= 992) {
    //  dom.classList.add('sidebar-left-close');
    //} else {
    //  if (dom.classList.contains('boxed-page') === true) {
    //    dom.classList.add('sidebar-left-close');
    //  } else {
    //    dom.classList.remove('sidebar-left-close');
    //  }
    //}

    //document.querySelector('body').classList.remove(this.pushbody);
    //document.querySelector('.wrapper').classList.remove(this.pushwrapper);

  }

}
