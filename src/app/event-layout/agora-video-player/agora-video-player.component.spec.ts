import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgoraVideoPlayerComponent } from './agora-video-player.component';

describe('AgoraVideoPlayerComponent', () => {
  let component: AgoraVideoPlayerComponent;
  let fixture: ComponentFixture<AgoraVideoPlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgoraVideoPlayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgoraVideoPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
