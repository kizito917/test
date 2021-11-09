import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AudioBalancerComponent } from './audio-balancer.component';

describe('AudioBalancerComponent', () => {
  let component: AudioBalancerComponent;
  let fixture: ComponentFixture<AudioBalancerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AudioBalancerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AudioBalancerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
