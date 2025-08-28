import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';
import { environment } from '../../../../enviroments/environment';
import { BackendApiService, BulkScrapeSummary } from '../backend-api.service';
import { ScrapingService } from '../scraping.service';

describe('ScrapingService', () => {
  let service: ScrapingService;
  let backendApiServiceSpy: jasmine.SpyObj<BackendApiService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
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
    
    service = TestBed.inject(ScrapingService);
    backendApiServiceSpy = TestBed.inject(BackendApiService) as jasmine.SpyObj<BackendApiService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('startScraping', () => {
    it('should process campaign data into chunks', () => {
      // Create mock campaign with hashtags, keywords, and mentions
      // Using 'as any' to bypass strict typing for test
      const mockCampaign = {
        id: 'campaign1',
        name: 'Test Campaign',
        description: 'Test description',
        hashtags: ['#test1', '#test2', '#test3'],
        keywords: ['keyword1', 'keyword2'],
        mentions: ['@user1', '@user2'],
        languages: ['es'],
        dataSources: ['twitter'],
        status: 'active',
        createdAt: new Date(),
        type: 'hashtag',
        startDate: new Date(),
        endDate: new Date(),
        sentimentAnalysis: true
      } as any; // Cast to any to avoid typing issues in tests
      
      // Mock successful responses
      const successResponse: BulkScrapeSummary = {
        success: true,
        data: {
          items: [{
            type: 'hashtag',
            identifier: 'test1',
            requested: 1,
            totalFound: 10,
            totalScraped: 10,
            saved: 10
          }],
          totalTweets: 10,
          campaignId: 'campaign1'
        }
      };
      
      backendApiServiceSpy.scrapeHashtags.and.returnValue(of(successResponse));
      backendApiServiceSpy.scrapeSearch.and.returnValue(of(successResponse));
      backendApiServiceSpy.scrapeUsers.and.returnValue(of(successResponse));
      backendApiServiceSpy.getCampaignTweets.and.returnValue(of([]));
      
      // Start scraping
      service.startScraping(mockCampaign).subscribe();
      
      // Verify API calls
      expect(backendApiServiceSpy.scrapeHashtags).toHaveBeenCalled();
      
      // Check that hashtags were processed correctly (prefixes stripped)
      const hashtagsCallArgs = backendApiServiceSpy.scrapeHashtags.calls.first().args;
      expect(hashtagsCallArgs[0]).toEqual(['test1', 'test2', 'test3']);
      
      // Check options safely
      const options = hashtagsCallArgs[1];
      expect(options).toBeDefined();
      if (options) {
        expect(options.campaignId).toBe('campaign1');
        expect(options.language).toBe('es');
      }
    });

    it('should handle errors gracefully', () => {
      const mockCampaign = {
        id: 'campaign1',
        name: 'Test Campaign',
        hashtags: ['#test1'],
        keywords: [],
        mentions: [],
        status: 'active',
        createdAt: new Date(),
        type: 'hashtag',
        startDate: new Date(),
        endDate: new Date(),
        maxTweets: 100,
        sentimentAnalysis: true
      } as any; // Cast to any for testing
      
      // Force an error
      const errorResponse = new Error('API Error');
      backendApiServiceSpy.scrapeHashtags.and.returnValue(throwError(() => errorResponse));
      
      // Configure environment for mockData
      const originalMockDataSetting = environment.features.mockData;
      environment.features.mockData = true;
      
      // Start scraping
      service.startScraping(mockCampaign).subscribe({
        error: () => fail('Error should have been handled')
      });
      
      // Verify error handling
      expect(snackBarSpy.open).toHaveBeenCalled();
      expect(snackBarSpy.open.calls.first().args[0]).toContain('Error scraping');
      
      // Restore environment
      environment.features.mockData = originalMockDataSetting;
    });
  });
});
