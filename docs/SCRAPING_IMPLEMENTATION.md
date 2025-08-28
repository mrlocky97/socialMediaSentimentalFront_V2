# Social Media Scraping Implementation

## Overview

This document describes the implementation of social media scraping functionality in the SocialMediaSentimental application. The feature enables automatic and manual scraping of social media content based on campaign parameters (hashtags, search terms, and user accounts).

## Architecture

The scraping implementation follows clean architecture principles with the following components:

1. **BackendApiService** - Handles API calls to backend scraping endpoints
2. **ScrapingService** - Orchestrates the scraping process with progress tracking
3. **CampaignDetailComponent** - Provides UI for manual scraping triggering and progress visualization
4. **ModernCampaignWizard** - Automatically triggers scraping after campaign creation
5. **String Utilities** - Provides helper functions for processing input data

## Key Features

### Automatic Scraping After Campaign Creation

When a new campaign is created through the campaign wizard, scraping is automatically triggered once the user is redirected to the campaign detail page. This provides immediate data collection without requiring manual intervention.

### Manual Scraping Trigger

A "Run scraping now" button is available on the campaign detail page, allowing users to manually trigger the scraping process at any time. This is useful for refreshing data or when automatic scraping was not performed.

### Progress Tracking

The UI provides visual feedback during scraping operations:
- Progress bar showing completion percentage
- Status messages indicating current operation
- Notification upon completion or errors

### Fault Tolerance

The scraping implementation includes:
- Retry mechanisms for failed requests
- Graceful error handling with user feedback
- Fallback to mock data when API is unavailable (in development mode)

## Implementation Details

### String Array Utilities

```typescript
// Converts various input types to string arrays and normalizes them
export function toStringArray(input: string | string[] | null | undefined): string[] {
  // Implementation details...
}

// Splits arrays into chunks of specified size
export function chunk<T>(array: T[], size: number): T[][] {
  // Implementation details...
}
```

### Backend API Service

The `BackendApiService` provides methods to interact with the scraping endpoints:

```typescript
// Scrape social media content based on hashtags
scrapeHashtags(hashtags: string[], campaignId: string): Observable<ScrapingResponse>

// Scrape social media content based on search terms
scrapeSearch(searchTerms: string[], campaignId: string): Observable<ScrapingResponse>

// Scrape social media content from specific user accounts
scrapeUsers(users: string[], campaignId: string): Observable<ScrapingResponse>
```

### Scraping Service

The `ScrapingService` manages the scraping workflow:

```typescript
// Starts the scraping process for a campaign
startScraping(campaign: Campaign): Observable<ScrapingProgress>
```

This service:
1. Extracts hashtags, search terms, and users from the campaign
2. Processes them in batches to prevent overwhelming the backend
3. Tracks progress and reports it back to the UI
4. Handles errors and retry logic

### User Interface Components

The campaign detail component displays:
- A button to trigger manual scraping
- Progress indicators during active scraping
- Success/error notifications
- Status of the last scraping operation

## Usage Examples

### Automatic Scraping

Simply complete the campaign creation wizard, and scraping will begin automatically when redirected to the detail page.

### Manual Scraping

1. Navigate to a campaign's detail page
2. Click the "Run scraping now" button
3. Monitor progress through the UI indicators
4. Receive notification when scraping is complete

## API Response Format

The backend scraping endpoints return responses in the following format:

```typescript
interface ScrapingResponse {
  success: boolean;
  count: number;
  message: string;
  data?: any[];
}
```

## Testing

Comprehensive unit tests have been created for:
- String utility functions
- Backend API service methods
- Scraping service functionality
- UI component interactions

## Future Improvements

Potential enhancements for future iterations:
- Scheduled automatic scraping at user-defined intervals
- Parallel processing for faster scraping operations
- More detailed progress reporting with estimated time to completion
- Configurable scraping parameters (depth, frequency, etc.)
