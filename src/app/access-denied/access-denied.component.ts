import {Component, OnInit} from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  templateUrl: './access-denied.component.html',
  styleUrls: ['./access-denied.component.scss']
})
export class AccessDeniedComponent implements OnInit {

  //pushbody: string = "sidebar-left-close";
  //pushwrapper: string = "p-0";

  constructor(private router: Router) { }

  ngOnInit() {

    //document.querySelector('body').classList.add(this.pushbody);
    //document.querySelector('.wrapper').classList.add(this.pushwrapper);
  }

  goToContactUs() {
    this.router.navigate(['/contact-us']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

}
