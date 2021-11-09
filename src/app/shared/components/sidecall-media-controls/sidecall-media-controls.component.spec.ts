import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidecallMediaControlsComponent } from './sidecall-media-controls.component';

describe('SidecallMediaControlsComponent', () => {
  let component: SidecallMediaControlsComponent;
  let fixture: ComponentFixture<SidecallMediaControlsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidecallMediaControlsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidecallMediaControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
