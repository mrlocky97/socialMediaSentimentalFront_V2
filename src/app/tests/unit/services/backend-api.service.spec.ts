import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { BackendApiService, BulkScrapeSummary, ScrapeOpts } from '../../../core/services/backend-api.service';
import { environment } from '../../../../enviroments/environment';
import { MOCK_SCRAPE_OPTS, MOCK_SCRAPE_SUCCESS_RESPONSE } from '../../mocks/scraping.mock';

/**
 * Unit tests for BackendApiService scraping methods
 */
describe('BackendApiService - Scraping Methods', () => {
  let service: BackendApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [BackendApiService]
    });
    service = TestBed.inject(BackendApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('scrapeHashtags()', () => {
    const endpoint = `${environment.apiUrl}/api/${environment.apiVersion}/scraping/hashtag`;
    
    it('should handle single string input', () => {
      service.scrapeHashtags('test').subscribe(response => {
        expect(response).toBeTruthy();
        expect(response.success).toBeTrue();
      });

      const req = httpMock.expectOne(endpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ hashtag: ['test'] });
      req.flush(MOCK_SCRAPE_SUCCESS_RESPONSE);
    });

    it('should handle array input', () => {
      const hashtags = ['test1', 'test2'];
      
      service.scrapeHashtags(hashtags).subscribe(response => {
        expect(response).toBeTruthy();
        expect(response.success).toBeTrue();
        expect(response.data?.items.length).toBe(1);
      });

      const req = httpMock.expectOne(endpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ hashtag: hashtags });
      req.flush(MOCK_SCRAPE_SUCCESS_RESPONSE);
    });

    it('should include scrape options in request body', () => {
      const opts: ScrapeOpts = MOCK_SCRAPE_OPTS;

      service.scrapeHashtags('test', opts).subscribe();

      const req = httpMock.expectOne(endpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        hashtag: ['test'],
        limit: opts.limit,
        language: opts.language,
        includeReplies: opts.includeReplies,
        analyzeSentiment: opts.analyzeSentiment,
        campaignId: opts.campaignId
      });
    });
  });

  describe('scrapeSearch()', () => {
    const endpoint = `${environment.apiUrl}/api/${environment.apiVersion}/scraping/search`;
    
    it('should handle single string input', () => {
      service.scrapeSearch('test query').subscribe(response => {
        expect(response).toBeTruthy();
      });

      const req = httpMock.expectOne(endpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ search: ['test query'] });
      req.flush(MOCK_SCRAPE_SUCCESS_RESPONSE);
    });

    it('should include campaign ID when provided', () => {
      const campaignId = 'test-campaign';
      
      service.scrapeSearch('test query', { campaignId }).subscribe();

      const req = httpMock.expectOne(endpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.campaignId).toBe(campaignId);
      req.flush(MOCK_SCRAPE_SUCCESS_RESPONSE);
    });
  });

  describe('scrapeUsers()', () => {
    const endpoint = `${environment.apiUrl}/api/${environment.apiVersion}/scraping/user`;
    
    it('should handle array input with options', () => {
      const users = ['user1', 'user2'];
      const opts = MOCK_SCRAPE_OPTS;
      
      service.scrapeUsers(users, opts).subscribe();

      const req = httpMock.expectOne(endpoint);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        user: users,
        limit: opts.limit,
        language: opts.language,
        includeReplies: opts.includeReplies,
        analyzeSentiment: opts.analyzeSentiment,
        campaignId: opts.campaignId
      });
      req.flush(MOCK_SCRAPE_SUCCESS_RESPONSE);
    });
  });
});
