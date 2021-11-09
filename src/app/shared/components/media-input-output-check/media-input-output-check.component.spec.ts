import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MediaInputOutputCheckComponent } from './media-input-output-check.component';

describe('MediaInputOutputCheckComponent', () => {
  let component: MediaInputOutputCheckComponent;
  let fixture: ComponentFixture<MediaInputOutputCheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MediaInputOutputCheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MediaInputOutputCheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
