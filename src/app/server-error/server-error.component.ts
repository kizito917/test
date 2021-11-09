import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-server-error',
  templateUrl: './server-error.component.html',
  styleUrls: ['./server-error.component.scss']
})
export class ServerErrorComponent implements OnInit {
  //pushbody: string = "sidebar-left-close";
  //pushwrapper: string = "p-0";
  constructor(private router: Router) { }

  ngOnInit() {
    //document.querySelector('body').classList.add(this.pushbody);
    //document.querySelector('.wrapper').classList.add(this.pushwrapper);
  }

  tryAgain() {
    this.router.navigate(['/login']);
  }
}
