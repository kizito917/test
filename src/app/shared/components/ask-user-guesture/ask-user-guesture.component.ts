import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-ask-user-guesture',
  templateUrl: './ask-user-guesture.component.html',
  styleUrls: ['./ask-user-guesture.component.scss']
})
export class AskUserGuestureComponent implements OnInit {
  @Input() audioPlayFailed:boolean;

  constructor() { }

  ngOnInit(): void {
  }
  audioPlayBack(){
    this.audioPlayFailed=false;
  }
}
