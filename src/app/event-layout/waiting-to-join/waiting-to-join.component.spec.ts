import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WaitingToJoinComponent } from './waiting-to-join.component';

describe('WaitingToJoinComponent', () => {
  let component: WaitingToJoinComponent;
  let fixture: ComponentFixture<WaitingToJoinComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WaitingToJoinComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WaitingToJoinComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
