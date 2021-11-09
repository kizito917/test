import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveQaComponent } from './live-qa.component';

describe('LiveQaComponent', () => {
  let component: LiveQaComponent;
  let fixture: ComponentFixture<LiveQaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LiveQaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LiveQaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
