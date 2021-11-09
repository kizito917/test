import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AskUserGuestureComponent } from './ask-user-guesture.component';

describe('AskUserGuestureComponent', () => {
  let component: AskUserGuestureComponent;
  let fixture: ComponentFixture<AskUserGuestureComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AskUserGuestureComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AskUserGuestureComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
