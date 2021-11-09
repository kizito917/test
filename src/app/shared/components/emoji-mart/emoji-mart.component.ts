import { Component, EventEmitter, OnInit, Output } from "@angular/core";

@Component({
  selector: "app-emoji-mart",
  templateUrl: "./emoji-mart.component.html",
  styleUrls: ["./emoji-mart.component.scss"],
})
export class EmojiMartComponent implements OnInit {
  @Output() onEmojiSelect = new EventEmitter();
  constructor() {}

  ngOnInit(): void {}

  emojiSelected(event) {
    this.onEmojiSelect.emit(event);
  }
}
