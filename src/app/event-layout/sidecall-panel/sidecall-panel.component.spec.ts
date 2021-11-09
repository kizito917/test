import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SidecallPanelComponent } from './sidecall-panel.component';

describe('SidecallPanelComponent', () => {
  let component: SidecallPanelComponent;
  let fixture: ComponentFixture<SidecallPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SidecallPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SidecallPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
