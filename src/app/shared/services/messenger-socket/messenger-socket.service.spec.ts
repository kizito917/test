import { TestBed } from '@angular/core/testing';

import { MessengerSocketService } from './messenger-socket.service';

describe('MessengerSocketService', () => {
  let service: MessengerSocketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessengerSocketService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
