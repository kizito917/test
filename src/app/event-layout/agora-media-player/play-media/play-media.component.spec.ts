import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PlayMediaComponent } from './play-media.component';

describe('PlayMediaComponent', () => {
  let component: PlayMediaComponent;
  let fixture: ComponentFixture<PlayMediaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayMediaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PlayMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
