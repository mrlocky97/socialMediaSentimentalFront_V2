/**
 * Scraping State Service
 * Manages persistent scraping state to prevent duplicate scraping on page reloads
 */

import { Injectable } from '@angular/core';

interface ScrapingSessionState {
  campaignId: string;
  scrapingInitiated: boolean;
  lastScrapingTime: number;
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScrapingStateService {
  private readonly STORAGE_KEY = 'scraping_session_state';
  private readonly SCRAPING_COOLDOWN = 2 * 60 * 1000; // 2 minutes cooldown between scraping
  private readonly sessionId: string;

  constructor() {
    // Generate a unique session ID for this browser session
    this.sessionId = this.generateSessionId();
  }

  /**
   * Check if scraping has been initiated for a campaign in this session
   */
  hasScrapingBeenInitiated(campaignId: string): boolean {
    const state = this.getScrapingState(campaignId);
    
    if (!state) return false;

    // If it's the same session and scraping was initiated, return true
    if (state.sessionId === this.sessionId && state.scrapingInitiated) {
      return true;
    }

    // If it's a different session but scraping happened recently, also return true
    const timeSinceLastScraping = Date.now() - state.lastScrapingTime;
    if (timeSinceLastScraping < this.SCRAPING_COOLDOWN) {
      console.log(`Scraping cooldown active for campaign ${campaignId}. Last scraping was ${Math.round(timeSinceLastScraping / 1000)}s ago.`);
      return true;
    }

    return false;
  }

  /**
   * Mark scraping as initiated for a campaign
   */
  markScrapingInitiated(campaignId: string): void {
    const state: ScrapingSessionState = {
      campaignId,
      scrapingInitiated: true,
      lastScrapingTime: Date.now(),
      sessionId: this.sessionId
    };

    try {
      localStorage.setItem(`${this.STORAGE_KEY}_${campaignId}`, JSON.stringify(state));
      console.log(`Marked scraping as initiated for campaign ${campaignId}`);
    } catch (error) {
      console.warn('Failed to save scraping state to localStorage:', error);
    }
  }

  /**
   * Clear scraping state for a campaign (useful for testing or manual reset)
   */
  clearScrapingState(campaignId: string): void {
    try {
      localStorage.removeItem(`${this.STORAGE_KEY}_${campaignId}`);
      console.log(`Cleared scraping state for campaign ${campaignId}`);
    } catch (error) {
      console.warn('Failed to clear scraping state from localStorage:', error);
    }
  }

  /**
   * Get scraping state for a campaign
   */
  private getScrapingState(campaignId: string): ScrapingSessionState | null {
    try {
      const stateJson = localStorage.getItem(`${this.STORAGE_KEY}_${campaignId}`);
      if (!stateJson) return null;

      const state: ScrapingSessionState = JSON.parse(stateJson);
      
      // Validate the state structure
      if (!state.campaignId || !state.sessionId || typeof state.scrapingInitiated !== 'boolean') {
        console.warn('Invalid scraping state found, clearing it');
        this.clearScrapingState(campaignId);
        return null;
      }

      return state;
    } catch (error) {
      console.warn('Failed to read scraping state from localStorage:', error);
      return null;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get all campaign IDs that have scraping state
   */
  getAllCampaignStates(): { [campaignId: string]: ScrapingSessionState } {
    const states: { [campaignId: string]: ScrapingSessionState } = {};

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.STORAGE_KEY)) {
          const campaignId = key.replace(`${this.STORAGE_KEY}_`, '');
          const state = this.getScrapingState(campaignId);
          if (state) {
            states[campaignId] = state;
          }
        }
      }
    } catch (error) {
      console.warn('Failed to read all campaign states:', error);
    }

    return states;
  }

  /**
   * Clean up old scraping states (older than 24 hours)
   */
  cleanupOldStates(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const allStates = this.getAllCampaignStates();

    Object.entries(allStates).forEach(([campaignId, state]) => {
      if (state.lastScrapingTime < oneDayAgo) {
        this.clearScrapingState(campaignId);
        console.log(`Cleaned up old scraping state for campaign ${campaignId}`);
      }
    });
  }
}