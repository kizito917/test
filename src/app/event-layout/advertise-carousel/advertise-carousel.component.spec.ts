import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdvertiseCarouselComponent } from './advertise-carousel.component';

describe('AdvertiseCarouselComponent', () => {
  let component: AdvertiseCarouselComponent;
  let fixture: ComponentFixture<AdvertiseCarouselComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdvertiseCarouselComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdvertiseCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
