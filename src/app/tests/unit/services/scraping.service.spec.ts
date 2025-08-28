import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { BackendApiService } from '../../../core/services/backend-api.service';
import { ScrapingService } from '../../../core/services/scraping.service';
import { 
  MOCK_CAMPAIGN, 
  MOCK_SCRAPE_SUCCESS_RESPONSE, 
  MOCK_SCRAPE_ERROR_RESPONSE 
} from '../../mocks/scraping.mock';

/**
 * Unit tests for the ScrapingService
 * Focuses on testing the orchestration of scraping operations
 */
describe('ScrapingService', () => {
  let service: ScrapingService;
  let backendApiServiceSpy: jasmine.SpyObj<BackendApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    // Create spy objects for dependencies
    const apiSpy = jasmine.createSpyObj('BackendApiService', [
      'scrapeHashtags', 
      'scrapeSearch', 
      'scrapeUsers',
      'getCampaignTweets'
    ]);
    
    const snackBarSpyObj = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    TestBed.configureTestingModule({
      providers: [
        ScrapingService,
        { provide: BackendApiService, useValue: apiSpy },
        { provide: MatSnackBar, useValue: snackBarSpyObj }
      ]
    });
    
    // Inject the service and spies
    service = TestBed.inject(ScrapingService);
    backendApiServiceSpy = TestBed.inject(BackendApiService) as jasmine.SpyObj<BackendApiService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startScraping()', () => {
    it('should process campaign data into chunks', () => {
      // Setup API response mocks
      backendApiServiceSpy.scrapeHashtags.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.scrapeSearch.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.scrapeUsers.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.getCampaignTweets.and.returnValue(of([]));
      
      // Start scraping - using type assertion to handle Campaign interface differences
      // between app.state.ts and data-manager.service.ts
      service.startScraping(MOCK_CAMPAIGN as any).subscribe();
      
      // Verify hashtag scraping call
      expect(backendApiServiceSpy.scrapeHashtags).toHaveBeenCalled();
      
      // Check that hashtags were processed correctly (prefixes stripped)
      const hashtagsCallArgs = backendApiServiceSpy.scrapeHashtags.calls.first().args;
      expect(hashtagsCallArgs[0]).toEqual(['test1', 'test2', 'test3']);
      
      // Check that options include the campaign ID
      const options = hashtagsCallArgs[1];
      expect(options).toBeDefined();
      if (options) {
        expect(options.campaignId).toBe(MOCK_CAMPAIGN.id);
      }
      
      // Verify keyword and user scraping calls
      expect(backendApiServiceSpy.scrapeSearch).toHaveBeenCalled();
      expect(backendApiServiceSpy.scrapeUsers).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      // Setup error mock for one of the API calls
      backendApiServiceSpy.scrapeHashtags.and.returnValue(throwError(() => new Error('API Error')));
      backendApiServiceSpy.scrapeSearch.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.scrapeUsers.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.getCampaignTweets.and.returnValue(of([]));
      
      // Start scraping - using type assertion to handle model differences
      service.startScraping(MOCK_CAMPAIGN as any).subscribe({
        error: (err) => {
          // Error should be caught inside service and not propagated
          fail('Error should be handled inside service');
        }
      });
      
      // Verify error notification
      expect(snackBarSpy.open).toHaveBeenCalledWith(
        jasmine.stringMatching(/error/i),
        jasmine.any(String),
        jasmine.any(Object)
      );
    });
    
    it('should update progress state as operations complete', (done) => {
      // Setup API response mocks
      backendApiServiceSpy.scrapeHashtags.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.scrapeSearch.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.scrapeUsers.and.returnValue(of(MOCK_SCRAPE_SUCCESS_RESPONSE));
      backendApiServiceSpy.getCampaignTweets.and.returnValue(of([]));
      
      // Subscribe to progress updates
      let progressUpdates = 0;
      service.scrapingProgress$.subscribe(progress => {
        progressUpdates++;
        
        // Initial state should be reset
        if (progressUpdates === 1) {
          expect(progress.status).toBe('idle');
          expect(progress.progress).toBe(0);
        }
        
        // Should eventually reach completed state
        if (progress.status === 'completed') {
          expect(progress.progress).toBe(100);
          done();
        }
      });
      
      // Start scraping - using type assertion to handle model differences
      service.startScraping(MOCK_CAMPAIGN as any).subscribe();
    });
  });
});
