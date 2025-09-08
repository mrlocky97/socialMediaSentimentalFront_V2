/**
 * Campaign AI Insights Service - Optimizado
 * Generates AI-powered insights, predictions, and recommendations
 */
import { computed, Injectable, signal } from '@angular/core';
import { CampaignStats } from '../../../../core/interfaces/tweet.interface';
import { Campaign } from '../../../../core/state/app.state';
import {
  AIInsight,
  CampaignIntelligence,
  CampaignPrediction,
  CATEGORIES,
  INSIGHT_TYPES,
  PerformanceTrend,
  PRIORITY_LEVELS,
} from '../interfaces/campaign-detail-insight.interface';

@Injectable({
  providedIn: 'root',
})
export class CampaignAIService {
  // Signals privadas
  private _intelligence = signal<CampaignIntelligence | null>(null);
  private _analyzing = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Computed properties públicas
  readonly intelligence = computed(() => this._intelligence());
  readonly analyzing = computed(() => this._analyzing());
  readonly error = computed(() => this._error());

  // Cache para insights ya generados (por ID de campaña)
  private insightsCache = new Map<string, CampaignIntelligence>();

  /**
   * Generar inteligencia para una campaña
   */
  async generateIntelligence(
    campaign: Campaign,
    stats: CampaignStats,
    historicalData?: any[]
  ): Promise<void> {
    // Verificar si ya tenemos datos en caché para esta campaña
    const cacheKey = this.generateCacheKey(campaign, stats);
    const cachedData = this.insightsCache.get(cacheKey);

    if (cachedData && this.isCacheValid(cachedData)) {
      this._intelligence.set(cachedData);
      return;
    }

    this._analyzing.set(true);
    this._error.set(null);

    try {
      await this.simulateAIAnalysis();

      const intelligence = this.createCampaignIntelligence(campaign, stats);
      this._intelligence.set(intelligence);

      // Almacenar en caché para uso futuro
      this.insightsCache.set(cacheKey, intelligence);
    } catch (error) {
      this._error.set('Failed to generate AI insights');
      console.error('AI analysis error:', error);
    } finally {
      this._analyzing.set(false);
    }
  }

  /**
   * Refrescar inteligencia (ahora usa el mismo método con invalidación de caché)
   */
  async refreshIntelligence(campaign: Campaign, stats: CampaignStats): Promise<void> {
    // Invalidar caché para esta campaña
    const cacheKey = this.generateCacheKey(campaign, stats);
    this.insightsCache.delete(cacheKey);

    await this.generateIntelligence(campaign, stats);
  }

  /**
   * Obtener insights por categoría (optimizado con memoización)
   */
  getInsightsByCategory(category: string): AIInsight[] {
    const intelligence = this._intelligence();
    if (!intelligence) return [];

    // Usar un Map para caching por categoría si se vuelve intensivo
    return intelligence.insights.filter((insight) => insight.category === category);
  }

  /**
   * Obtener insights de alta prioridad
   */
  getHighPriorityInsights(): AIInsight[] {
    const intelligence = this._intelligence();
    if (!intelligence) return [];

    return intelligence.insights.filter(
      (insight) =>
        insight.priority === PRIORITY_LEVELS.HIGH || insight.priority === PRIORITY_LEVELS.CRITICAL
    );
  }

  /**
   * Aplicar recomendación (optimizado para inmutabilidad)
   */
  async applyRecommendation(insightId: string): Promise<void> {
    console.log(`Applying recommendation: ${insightId}`);

    const current = this._intelligence();
    if (!current) return;

    // Actualización inmutable más eficiente
    const updatedInsights = current.insights.filter((i) => i.id !== insightId);

    // Solo actualizar si hay cambios
    if (updatedInsights.length !== current.insights.length) {
      this._intelligence.set({
        ...current,
        insights: updatedInsights,
      });
    }
  }

  // Métodos privados optimizados

  private async simulateAIAnalysis(): Promise<void> {
    // Simular procesamiento AI con un tiempo variable según complejidad
    return new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
  }

  private generateCacheKey(campaign: Campaign, stats: CampaignStats): string {
    // Crear una clave única basada en los datos de la campaña y estadísticas
    return `${campaign.id}-${stats.totalTweets}-${stats.globalEngagementRate}-${stats.sentimentPercents.positive}`;
  }

  private isCacheValid(cachedData: CampaignIntelligence): boolean {
    // Validar si los datos en caché son aún válidos (menos de 5 minutos)
    const FIVE_MINUTES = 5 * 60 * 1000;
    return Date.now() - cachedData.lastAnalyzed.getTime() < FIVE_MINUTES;
  }

  private createCampaignIntelligence(
    campaign: Campaign,
    stats: CampaignStats
  ): CampaignIntelligence {
    // Ejecutar generación en paralelo cuando sea posible
    const [insights, predictions, trends, score] = [
      this.generateInsights(campaign, stats),
      this.generatePredictions(stats),
      this.generateTrends(stats),
      this.calculatePerformanceScore(stats),
    ];

    return {
      summary: this.generateSummary(campaign, stats, score),
      score,
      insights,
      predictions,
      trends,
      recommendations: this.categorizeRecommendations(insights),
      lastAnalyzed: new Date(),
    };
  }

  private generateInsights(campaign: Campaign, stats: CampaignStats): AIInsight[] {
    const insights: AIInsight[] = [];
    const { globalEngagementRate, sentimentPercents, topHashtags, totalTweets } = stats;

    // Reglas de negocio para insights
    const insightRules = [
      {
        condition: globalEngagementRate < 2,
        create: () => this.createEngagementInsight(globalEngagementRate),
      },
      {
        condition: sentimentPercents.negative > 30,
        create: () => this.createSentimentInsight(sentimentPercents.negative),
      },
      {
        condition: topHashtags.length > 0,
        create: () => this.createHashtagInsight(topHashtags[0]),
      },
      {
        condition: totalTweets < 100,
        create: () => this.createVolumeInsight(totalTweets),
      },
    ];

    // Ejecutar reglas y agregar insights
    insightRules.forEach((rule) => {
      if (rule.condition) {
        insights.push(rule.create());
      }
    });

    return insights;
  }

  private createEngagementInsight(engagementRate: number): AIInsight {
    return {
      id: 'eng-low-' + Date.now(),
      type: INSIGHT_TYPES.RECOMMENDATION,
      priority: PRIORITY_LEVELS.HIGH,
      title: 'Low Engagement Rate Detected',
      description:
        'Your engagement rate is below industry average. Consider optimizing content timing and hashtag strategy.',
      confidence: 85,
      impact: 'positive',
      actionable: true,
      action: {
        label: 'Optimize Content Strategy',
        type: 'optimize',
      },
      metrics: {
        current: engagementRate,
        predicted: engagementRate * 1.5,
        improvement: 50,
      },
      category: CATEGORIES.ENGAGEMENT,
      generatedAt: new Date(),
    };
  }

  private createSentimentInsight(negativeSentiment: number): AIInsight {
    return {
      id: 'sent-neg-' + Date.now(),
      type: INSIGHT_TYPES.ALERT,
      priority: PRIORITY_LEVELS.CRITICAL,
      title: 'High Negative Sentiment Detected',
      description: `Negative sentiment is above ${negativeSentiment}%. Immediate attention required to address community concerns.`,
      confidence: 92,
      impact: 'negative',
      actionable: true,
      action: {
        label: 'Review Negative Mentions',
        type: 'investigate',
      },
      category: CATEGORIES.SENTIMENT,
      generatedAt: new Date(),
    };
  }

  private createHashtagInsight(topHashtag: any): AIInsight {
    return {
      id: 'cont-hash-' + Date.now(),
      type: INSIGHT_TYPES.RECOMMENDATION,
      priority: PRIORITY_LEVELS.MEDIUM,
      title: 'Hashtag Performance Opportunity',
      description: `#${topHashtag.hashtag} is performing well. Consider creating more content around this theme.`,
      confidence: 78,
      impact: 'positive',
      actionable: true,
      action: {
        label: 'Expand Hashtag Strategy',
        type: 'expand',
      },
      category: CATEGORIES.CONTENT,
      generatedAt: new Date(),
    };
  }

  private createVolumeInsight(totalTweets: number): AIInsight {
    return {
      id: 'vol-low-' + Date.now(),
      type: INSIGHT_TYPES.RECOMMENDATION,
      priority: PRIORITY_LEVELS.MEDIUM,
      title: 'Low Content Volume',
      description:
        'Campaign has limited content volume. Consider increasing posting frequency or expanding keyword tracking.',
      confidence: 70,
      impact: 'positive',
      actionable: true,
      action: {
        label: 'Increase Content Volume',
        type: 'adjust',
      },
      category: CATEGORIES.REACH,
      generatedAt: new Date(),
    };
  }

  private generatePredictions(stats: CampaignStats): CampaignPrediction[] {
    return [
      {
        metric: 'engagement',
        current: stats.globalEngagementRate,
        predicted: stats.globalEngagementRate * 1.15,
        timeframe: '30d',
        confidence: 75,
        factors: ['Historical trend', 'Content optimization', 'Seasonal patterns'],
        trend: 'increasing',
      },
      {
        metric: 'sentiment',
        current: stats.sentimentPercents.positive,
        predicted: stats.sentimentPercents.positive * 1.08,
        timeframe: '30d',
        confidence: 68,
        factors: ['Content strategy', 'Community response', 'Brand perception'],
        trend: 'stable',
      },
    ];
  }

  private generateTrends(stats: CampaignStats): PerformanceTrend[] {
    const dates = Object.keys(stats.tweetsByDay).sort();
    const values = dates.map((date) => stats.tweetsByDay[date]);

    if (values.length <= 1) {
      return [
        {
          metric: 'Daily Tweet Volume',
          data: [],
          trend: 'stable',
          changePercent: 0,
          significance: 'low',
        },
      ];
    }

    const lastValue = values[values.length - 1];
    const firstValue = values[0];
    const changePercent = ((lastValue - firstValue) / firstValue) * 100;
    const trend = changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable';

    return [
      {
        metric: 'Daily Tweet Volume',
        data: dates.map((date, index) => ({ date, value: values[index] })),
        trend,
        changePercent,
        significance:
          Math.abs(changePercent) > 10 ? 'high' : Math.abs(changePercent) > 5 ? 'medium' : 'low',
      },
    ];
  }

  private calculatePerformanceScore(stats: CampaignStats): number {
    const { globalEngagementRate, sentimentPercents, totalTweets, analysisCoverage } = stats;

    // Pesos configurables para cada métrica
    const WEIGHTS = {
      engagement: 0.4, // 40%
      sentiment: 0.3, // 30%
      volume: 0.2, // 20%
      coverage: 0.1, // 10%
    };

    // Calcular cada componente
    const engagementScore = Math.min(globalEngagementRate * 20, 40) * WEIGHTS.engagement;
    const sentimentScore = sentimentPercents.positive * WEIGHTS.sentiment;
    const volumeScore = Math.min(totalTweets / 10, 20) * WEIGHTS.volume;
    const coverageScore = analysisCoverage * 10 * WEIGHTS.coverage;

    // Puntaje total
    const totalScore = engagementScore + sentimentScore + volumeScore + coverageScore;

    return Math.round(Math.min(totalScore, 100));
  }

  private generateSummary(campaign: Campaign, stats: CampaignStats, score: number): string {
    // Umbrales basados en benchmarks de la industria de social media
    const performanceLevels = [
      { threshold: 85, label: 'excellent' },      // Top 10% de campañas
      { threshold: 70, label: 'good' },           // Top 25% de campañas  
      { threshold: 50, label: 'average' },        // Promedio de la industria
      { threshold: 30, label: 'below average' },  // Necesita atención
      { threshold: 0, label: 'needs improvement' }, // Requiere acción inmediata
    ];

    const performance =
      performanceLevels.find((l) => score >= l.threshold)?.label || 'needs improvement';

    // Contexto adicional basado en métricas específicas
    const engagementContext = stats.globalEngagementRate > 3 ? 'strong' : 
                             stats.globalEngagementRate > 1 ? 'moderate' : 'low';
    
    const sentimentContext = stats.sentimentPercents.positive > 70 ? 'positive' :
                            stats.sentimentPercents.positive > 50 ? 'neutral' : 'concerning';

    return `Campaign "${campaign.name}" is showing ${performance} performance with a score of ${score}/100. 
    ${stats.totalTweets} tweets analyzed with ${stats.sentimentPercents.positive.toFixed(1)}% positive sentiment (${sentimentContext}) 
    and ${stats.globalEngagementRate.toFixed(2)}% engagement rate (${engagementContext} engagement).`;
  }

  private categorizeRecommendations(insights: AIInsight[]): {
    immediate: AIInsight[];
    shortTerm: AIInsight[];
    longTerm: AIInsight[];
  } {
    return {
      immediate: insights.filter((i) => i.priority === PRIORITY_LEVELS.CRITICAL && i.actionable),
      shortTerm: insights.filter((i) => i.priority === PRIORITY_LEVELS.HIGH && i.actionable),
      longTerm: insights.filter((i) => i.priority === PRIORITY_LEVELS.MEDIUM && i.actionable),
    };
  }
}
