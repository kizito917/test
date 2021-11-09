import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveMediaRendererComponent } from './live-media-renderer.component';

describe('LiveMediaRendererComponent', () => {
  let component: LiveMediaRendererComponent;
  let fixture: ComponentFixture<LiveMediaRendererComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LiveMediaRendererComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LiveMediaRendererComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
