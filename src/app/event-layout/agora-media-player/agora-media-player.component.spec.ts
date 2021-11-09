import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgoraMediaPlayerComponent } from './agora-media-player.component';

describe('AgoraMediaPlayerComponent', () => {
  let component: AgoraMediaPlayerComponent;
  let fixture: ComponentFixture<AgoraMediaPlayerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgoraMediaPlayerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgoraMediaPlayerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
