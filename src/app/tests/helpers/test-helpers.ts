import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';

/**
 * Helper functions for tests
 */
export class TestHelpers {
  /**
   * Creates a mock error response for HTTP calls
   * @param status HTTP status code
   * @param message Error message
   * @returns Mock HTTP error response
   */
  static createHttpError(status: number, message: string): HttpErrorResponse {
    return new HttpErrorResponse({
      error: { message },
      status,
      statusText: 'Error'
    });
  }

  /**
   * Creates a test module with providers
   * @param providers Array of providers for the test module
   */
  static configureTestingModule(providers: any[] = []): void {
    TestBed.configureTestingModule({
      providers: [...providers]
    });
  }

  /**
   * Creates a mock campaign object for testing
   * @param overrides Properties to override in the default campaign
   * @returns Mock campaign object
   */
  static createMockCampaign(overrides: any = {}): any {
    return {
      id: 'test-campaign-id',
      name: 'Test Campaign',
      description: 'Test campaign description',
      hashtags: ['#test1', '#test2'],
      keywords: ['keyword1', 'keyword2'],
      mentions: ['@user1', '@user2'],
      languages: ['es', 'en'],
      dataSources: ['twitter'],
      status: 'active',
      createdAt: new Date(),
      type: 'hashtag',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      sentimentAnalysis: true,
      organizationId: 'org-1',
      maxTweets: 500,
      ...overrides
    };
  }
}
