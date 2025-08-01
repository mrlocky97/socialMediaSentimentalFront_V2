import { TestBed } from '@angular/core/testing';
import { RxjsBaseService } from './rxjs-base.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

/**
 * Basic test suite for RxjsBaseService
 */
describe('RxjsBaseService', () => {
  let service: RxjsBaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [RxjsBaseService]
    });
    
    service = TestBed.inject(RxjsBaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have observable streams', () => {
    expect(service.event$).toBeDefined();
    expect(service.loading$).toBeDefined();
    expect(service.history$).toBeDefined();
  });

  it('should handle search operations', () => {
    const searchTerm = 'test query';
    expect(() => service.search(searchTerm)).not.toThrow();
  });
});
