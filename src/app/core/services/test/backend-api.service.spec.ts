import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../enviroments/environment';
import { BackendApiService, BulkScrapeSummary, ScrapeOpts } from '../backend-api.service';

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

  describe('scrapeHashtags', () => {
    it('should handle single string input', () => {
      const mockResponse: BulkScrapeSummary = {
        success: true,
        data: {
          items: [{
            type: 'hashtag',
            identifier: 'test',
            requested: 1,
            totalFound: 10,
            totalScraped: 10,
            saved: 10
          }],
          totalTweets: 10
        }
      };

      service.scrapeHashtags('test').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/scraping/hashtag`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ hashtag: ['test'] });
      req.flush(mockResponse);
    });

    it('should handle array input', () => {
      const mockResponse: BulkScrapeSummary = {
        success: true,
        data: {
          items: [
            {
              type: 'hashtag',
              identifier: 'test1',
              requested: 1,
              totalFound: 5,
              totalScraped: 5,
              saved: 5
            },
            {
              type: 'hashtag',
              identifier: 'test2',
              requested: 1,
              totalFound: 10,
              totalScraped: 10,
              saved: 10
            }
          ],
          totalTweets: 15
        }
      };

      service.scrapeHashtags(['test1', 'test2']).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/scraping/hashtag`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ hashtag: ['test1', 'test2'] });
      req.flush(mockResponse);
    });

    it('should include scrape options in request body', () => {
      const opts: ScrapeOpts = {
        limit: 30,
        language: 'es',
        includeReplies: false,
        analyzeSentiment: true,
        campaignId: '123'
      };

      service.scrapeHashtags('test', opts).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/scraping/hashtag`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        hashtag: ['test'],
        limit: 30,
        language: 'es',
        includeReplies: false,
        analyzeSentiment: true,
        campaignId: '123'
      });
    });
  });

  describe('scrapeSearch', () => {
    it('should handle single string input', () => {
      const mockResponse: BulkScrapeSummary = {
        success: true,
        data: {
          items: [{
            type: 'search',
            identifier: 'test',
            requested: 1,
            totalFound: 10,
            totalScraped: 10,
            saved: 10
          }],
          totalTweets: 10
        }
      };

      service.scrapeSearch('test').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/scraping/search`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ query: ['test'] });
      req.flush(mockResponse);
    });

    it('should include campaign ID when provided', () => {
      service.scrapeSearch('test', { campaignId: '123' }).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/scraping/search`);
      expect(req.request.body.campaignId).toBe('123');
    });
  });

  describe('scrapeUsers', () => {
    it('should handle array input with options', () => {
      const opts: ScrapeOpts = {
        limit: 50,
        campaignId: '123'
      };

      service.scrapeUsers(['user1', 'user2'], opts).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/${environment.apiVersion}/scraping/user`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        username: ['user1', 'user2'],
        limit: 50,
        campaignId: '123'
      });
    });
  });
});
