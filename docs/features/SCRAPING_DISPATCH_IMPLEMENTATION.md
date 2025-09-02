# Scraping Dispatch Implementation

## Overview

The scraping dispatch system enables different scraping strategies based on campaign type. This allows for more specialized data collection tailored to each campaign's specific objectives and requirements.

## Architecture

The implementation follows a dispatch pattern where a central service (`ScrapingDispatchService`) determines which specialized scraping method to use based on the campaign's type.

## Available API Endpoints

The scraping dispatch service leverages the following backend API endpoints:

| Method | Endpoint | Description |
|--------|---------|-------------|
| POST | `/api/v1/scraping/hashtag` | Scrape tweets by hashtag |
| POST | `/api/v1/scraping/reauth` | Force Twitter re-authentication |
| POST | `/api/v1/scraping/search` | Scrape tweets by search query |
| GET | `/api/v1/scraping/status` | Get scraping service status |
| GET | `/api/v1/scraping/tweets` | List scraped tweets |
| POST | `/api/v1/scraping/user` | Scrape tweets from user |

### Key Components

1. **ScrapingDispatchService**: Central dispatcher that analyzes campaign type and routes to the appropriate scraping method
2. **CampaignDetailComponent**: UI component that triggers scraping and displays progress
3. **ScrapingService**: Base service that handles the actual scraping operations

## Campaign Type Support

The system supports dispatching based on these campaign types:

| Campaign Type | Primary Focus | Scraping Strategy | Primary Endpoints |
|---------------|--------------|-------------------|----------------|
| `hashtag` | Hashtag tracking | Focus on hashtags first, then keywords/mentions | `/api/v1/scraping/hashtag` |
| `user` / `mention` | User activity | Focus on user mentions first, then related hashtags | `/api/v1/scraping/user` |
| `keyword` | Keyword monitoring | Focus on keywords first, then related hashtags | `/api/v1/scraping/search` |
| `brand-monitoring` | Brand mentions | Balanced approach with slight emphasis on brand terms | `/api/v1/scraping/search`, `/api/v1/scraping/hashtag` |
| `competitor-analysis` | Competitor tracking | Focus on competitor names and related terms | `/api/v1/scraping/user`, `/api/v1/scraping/search` |
| `market-research` | General research | Broad approach covering multiple sources | All endpoints with emphasis on `/api/v1/scraping/search` |

## Implementation Details

### Type Conversion Logic

The system handles the conversion between different campaign model formats:

```typescript
private convertToDataManagerCampaign(campaign: AppStateCampaign): DataManagerCampaign {
  // Create a compatible campaign object for scraping service
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description || '',
    // ... other fields mapped here
  };
}
```

### Type-Based Dispatch

The main dispatch logic that determines the appropriate scraping method:

```typescript
public dispatchScraping(campaign: AppStateCampaign): Observable<boolean> {
  // Convert campaign to the format expected by ScrapingService
  const convertedCampaign = this.convertToDataManagerCampaign(campaign);
  
  // Dispatch based on campaign type
  switch (campaign.type) {
    case 'hashtag':
      return this.scrapingService.startScraping(convertedCampaign);
    case 'user':
    case 'mention':
      return this.dispatchUserScraping(convertedCampaign);
    // ... other types handled here
  }
}
```

## Usage

To use the scraping dispatch system:

1. Inject the `ScrapingDispatchService` into your component
2. Call `dispatchScraping` passing the campaign object
3. The service will handle conversion and dispatch to the appropriate scraping method

Example:

```typescript
// In a component
this.scrapingDispatchService.dispatchScraping(campaign)
  .subscribe({
    // Handle completion or errors
  });
```

## Future Extensions

The dispatch system is designed to be extended with:

1. More sophisticated scraping algorithms per campaign type
2. Custom rate limiting based on campaign priority
3. Specialized data processing for different campaign objectives
4. AI-powered scraping optimization based on previous results
5. Direct integration with specific API endpoints rather than going through the general service
6. Status monitoring and automatic re-authentication using the `/api/v1/scraping/status` and `/api/v1/scraping/reauth` endpoints
7. Real-time polling of scraped tweets using the `/api/v1/scraping/tweets` endpoint

## Technical Notes

- Campaign model conversion is handled internally to bridge differences between state and service models
- All dispatched operations return a standardized Observable<boolean> interface
- Progress reporting remains consistent across all scraping methods
