import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ScrapingDispatchService } from '../../../core/services/scraping-dispatch.service';
import { ScrapingService } from '../../../core/services/scraping.service';
import { Campaign } from '../../../core/state/app.state';

describe('ScrapingDispatchService', () => {
  let service: ScrapingDispatchService;
  let scrapingServiceSpy: jasmine.SpyObj<ScrapingService>;
  let snackBarSpy: jasmine.SpyObj<MatSnackBar>;
  
  const mockCampaign: Campaign = {
    id: 'test-1',
    name: 'Test Campaign',
    description: 'Test description',
    hashtags: ['#test'],
    keywords: ['test'],
    mentions: ['@test'],
    status: 'active',
    type: 'hashtag',
    startDate: new Date(),
    endDate: new Date(),
    maxTweets: 100,
    sentimentAnalysis: true,
    createdAt: new Date(),
    dataSources: ['twitter']
  };
  
  beforeEach(() => {
    const spyScrapingService = jasmine.createSpyObj('ScrapingService', ['startScraping']);
    spyScrapingService.startScraping.and.returnValue(of(true));
    
    const spySnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);
    
    TestBed.configureTestingModule({
      providers: [
        ScrapingDispatchService,
        { provide: ScrapingService, useValue: spyScrapingService },
        { provide: MatSnackBar, useValue: spySnackBar }
      ]
    });
    
    service = TestBed.inject(ScrapingDispatchService);
    scrapingServiceSpy = TestBed.inject(ScrapingService) as jasmine.SpyObj<ScrapingService>;
    snackBarSpy = TestBed.inject(MatSnackBar) as jasmine.SpyObj<MatSnackBar>;
  });
  
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  
  it('should dispatch hashtag campaign correctly', () => {
    service.dispatchScraping(mockCampaign).subscribe();
    
    expect(scrapingServiceSpy.startScraping).toHaveBeenCalled();
    expect(snackBarSpy.open).toHaveBeenCalledWith(
      `Starting scraping for ${mockCampaign.name}...`, 
      'Close', 
      { duration: 3000 }
    );
  });
  
  it('should dispatch user campaign correctly', () => {
    const userCampaign = { ...mockCampaign, type: 'user' };
    
    service.dispatchScraping(userCampaign).subscribe();
    
    expect(scrapingServiceSpy.startScraping).toHaveBeenCalled();
  });
  
  it('should dispatch keyword campaign correctly', () => {
    const keywordCampaign = { ...mockCampaign, type: 'keyword' };
    
    service.dispatchScraping(keywordCampaign).subscribe();
    
    expect(scrapingServiceSpy.startScraping).toHaveBeenCalled();
  });
  
  it('should dispatch brand-monitoring campaign correctly', () => {
    const brandCampaign = { ...mockCampaign, type: 'brand-monitoring' };
    
    service.dispatchScraping(brandCampaign).subscribe();
    
    expect(scrapingServiceSpy.startScraping).toHaveBeenCalled();
  });
  
  it('should handle unknown campaign type with default implementation', () => {
    const unknownCampaign = { ...mockCampaign, type: 'unknown-type' };
    
    service.dispatchScraping(unknownCampaign).subscribe();
    
    expect(scrapingServiceSpy.startScraping).toHaveBeenCalled();
  });
});
