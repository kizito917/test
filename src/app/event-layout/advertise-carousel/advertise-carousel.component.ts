import { Component, OnInit,Input } from '@angular/core';
import { NgbCarouselConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-advertise-carousel',
  templateUrl: './advertise-carousel.component.html',
  styleUrls: ['./advertise-carousel.component.scss']
})
export class AdvertiseCarouselComponent implements OnInit {

  @Input() interval = 20;
  @Input() advertise_banners = [];
  @Input() is_active = false;
  @Input() active_advertise_banner = '';
  @Input() advertise_banner_url = '';

  showNavigationArrows = false;
  showNavigationIndicators = false;

  //paused = false;
  //unpauseOnArrow = false;
  //pauseOnIndicator = false;
  //pauseOnHover = true;
  //pauseOnFocus = true;

  //@ViewChild('carousel', { static: true }) carousel: NgbCarousel;

  constructor(config: NgbCarouselConfig) {
    ////this.advertise_banners = [62, 83, 466, 965, 982, 1043, 738].map((n) => `https://picsum.photos/id/${n}/900/500`);
    // customize default values of carousels used by this component tree
    config.showNavigationArrows = true;
    config.showNavigationIndicators = true;
  }

  ngOnInit(): void {
    
  }

  //togglePaused() {
  //  if (this.paused) {
  //    this.carousel.cycle();
  //  } else {
  //    this.carousel.pause();
  //  }
  //  this.paused = !this.paused;
  //}

  //onSlide(slideEvent: NgbSlideEvent) {
  //  if (this.unpauseOnArrow && slideEvent.paused &&
  //    (slideEvent.source === NgbSlideEventSource.ARROW_LEFT || slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)) {
  //    this.togglePaused();
  //  }
  //  if (this.pauseOnIndicator && !slideEvent.paused && slideEvent.source === NgbSlideEventSource.INDICATOR) {
  //    this.togglePaused();
  //  }
  //}

}
