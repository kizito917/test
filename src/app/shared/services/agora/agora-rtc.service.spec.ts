import { TestBed } from '@angular/core/testing';

import { AgoraRtcService } from './agora-rtc.service';

describe('AgoraRtcService', () => {
  let service: AgoraRtcService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgoraRtcService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
