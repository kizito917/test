import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';


@Component({
  selector: 'app-not-found',
  templateUrl: './not-found.component.html',
  styleUrls: ['./not-found.component.scss']
})
export class NotFoundComponent implements OnInit {
  //pushbody: string ="sidebar-left-close";
  //pushwrapper: string ="p-0";
  constructor(private router: Router) { }

  ngOnInit() {
  //document.querySelector('body').classList.add(this.pushbody);
  //document.querySelector('.wrapper').classList.add(this.pushwrapper);
  }

  goBackToHome() {
    this.router.navigate(['/login']);
  }
  goToContactUs() {
    this.router.navigate(['/contact-us']);
  }
}
