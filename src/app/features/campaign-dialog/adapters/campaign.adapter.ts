import { Campaign as AppStateCampaign } from '../../../core/state/app.state';
import { Campaign as ApiCampaign } from '../../../core/services/data-manager.service';
import { CampaignRequest } from '../interfaces/campaign-dialog.interface';

// Extendemos la interfaz ApiCampaign para incluir los campos requeridos por la API
interface ApiCampaignExtended extends Omit<ApiCampaign, 'type'> {
  dataSources?: string[];
  type: string; // Reemplazar el tipo original para permitir los valores que espera la API
}

/**
 * Adaptador para convertir entre los diferentes tipos de Campaign usados en la aplicación
 */
export class CampaignAdapter {
  /**
   * Convierte una campaña de la API al formato usado en el estado global
   */
  static fromApiToState(apiCampaign: ApiCampaign): AppStateCampaign {
    return {
      id: apiCampaign.id,
      name: apiCampaign.name,
      description: apiCampaign.description,
      status: this.mapApiStatus(apiCampaign.status),
      type: this.mapApiType(apiCampaign.type),
      hashtags: apiCampaign.hashtags || [],
      keywords: apiCampaign.keywords || [],
      mentions: [], // La API no tiene mentions
      startDate: apiCampaign.startDate,
      endDate: apiCampaign.endDate,
      maxTweets: 1000, // Default value, API no tiene este campo
      sentimentAnalysis: true, // Default value, API no tiene este campo
      createdBy: 'system', // Default value, API no tiene este campo
      createdAt: apiCampaign.createdAt,
      updatedAt: new Date(), // Default value, API no tiene este campo
      stats: apiCampaign.stats ? {
        totalTweets: apiCampaign.stats.totalTweets,
        totalEngagement: apiCampaign.stats.engagementRate * 100, // Convertir tasa a valor total
        avgSentiment: apiCampaign.stats.averageSentiment,
        sentimentDistribution: apiCampaign.stats.sentimentDistribution,
        topHashtags: [],
        topMentions: [],
        topKeywords: [],
        influencers: []
      } : undefined
    };
  }

  /**
   * Convierte una campaña del estado global al formato usado por la API
   */
  static fromStateToApi(stateCampaign: AppStateCampaign): Partial<ApiCampaignExtended> & { organizationId?: string } {
    return {
      id: stateCampaign.id,
      name: stateCampaign.name,
      description: stateCampaign.description || '',
      type: this.mapStateType(stateCampaign.type),
      status: this.mapStateStatus(stateCampaign.status),
      hashtags: stateCampaign.hashtags,
      keywords: stateCampaign.keywords,
      startDate: stateCampaign.startDate,
      endDate: stateCampaign.endDate,
      createdAt: stateCampaign.createdAt,
      organizationId: stateCampaign.organizationId || 'default-org-id', // Aseguramos que se envíe el organizationId
      stats: stateCampaign.stats ? {
        totalTweets: stateCampaign.stats.totalTweets,
        averageSentiment: stateCampaign.stats.avgSentiment,
        sentimentDistribution: stateCampaign.stats.sentimentDistribution,
        engagementRate: stateCampaign.stats.totalEngagement / 100, // Convertir total a tasa
        reachEstimate: 0,
        lastUpdated: new Date()
      } : undefined
    };
  }

  /**
   * Convierte una campaña del request al formato usado en el estado global
   */
  static fromRequestToState(request: CampaignRequest): Partial<AppStateCampaign> {
    return {
      name: request.name,
      description: request.description,
      type: request.type as any, // Casting directo porque CampaignType tiene valores similares
      hashtags: request.hashtags,
      keywords: request.keywords,
      mentions: request.mentions,
      startDate: new Date(request.startDate),
      endDate: new Date(request.endDate),
      maxTweets: request.maxTweets,
      sentimentAnalysis: request.sentimentAnalysis,
      emotionAnalysis: request.emotionAnalysis,
      topicsAnalysis: request.topicsAnalysis,
      influencerAnalysis: request.influencerAnalysis,
      organizationId: request.organizationId,
      status: 'inactive', // Default al crear
      createdBy: 'user', // Default value
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

/**
 * Convierte una campaña del request al formato usado por la API
 */
static fromRequestToApi(request: CampaignRequest): Partial<ApiCampaignExtended> & { type: string, organizationId: string } {
  // Extendemos el tipo para permitir cualquier string en type
  return {
    name: request.name,
    description: request.description,
    type: this.mapRequestType(request.type),
    hashtags: request.hashtags,
    keywords: request.keywords,
    startDate: new Date(request.startDate),
    endDate: new Date(request.endDate),
    status: 'draft',
    dataSources: request.dataSources || ['twitter'], // Asegurarnos de enviar el campo dataSources que es obligatorio
    organizationId: request.organizationId || 'default-org-id' // Asegurarnos de enviar siempre un organizationId
  };
}  private static mapApiStatus(status: string): AppStateCampaign['status'] {
    switch (status) {
      case 'active': return 'active';
      case 'paused': return 'paused';
      case 'completed': return 'completed';
      case 'draft':
      default: return 'inactive';
    }
  }

  private static mapStateStatus(status: string): ApiCampaign['status'] {
    switch (status) {
      case 'active': return 'active';
      case 'paused': return 'paused';
      case 'completed': return 'completed';
      case 'inactive':
      default: return 'draft';
    }
  }

  private static mapApiType(type: string): AppStateCampaign['type'] {
    switch (type) {
      case 'hashtag': return 'hashtag';
      case 'competitor': return 'user';
      case 'mention': return 'mention';
      case 'keyword':
      default: return 'keyword';
    }
  }

  private static mapStateType(type: string): string {
    // Usar los mismos valores que espera la API
    switch (type) {
      case 'hashtag': return 'hashtag';
      case 'user': return 'competitor';
      case 'mention': return 'mention';
      case 'keyword':
      default: return 'keyword';
    }
  }

  private static mapRequestType(type: string): string {
    // La API espera directamente: "hashtag", "keyword", "mention", "competitor"
    switch (type) {
      case 'hashtag': return 'hashtag'; // Ya está en el formato correcto
      case 'user': return 'competitor'; // Mapear user a competitor
      case 'keyword': return 'keyword'; // Ya está en el formato correcto
      case 'mention': return 'mention'; // Ya está en el formato correcto
      case 'custom':
      default: return 'keyword'; // Por defecto usamos keyword
    }
  }
}
