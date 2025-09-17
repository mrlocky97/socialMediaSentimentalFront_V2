import { Campaign as ApiCampaign } from '../../../core/services/data-manager.service';
import { Campaign as AppStateCampaign } from '../../../core/state/app.state';
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
      id: apiCampaign._id || apiCampaign.id,
      name: apiCampaign.name,
      description: apiCampaign.description,
      status: this.mapApiStatus(apiCampaign.status),
      type: this.mapApiType(apiCampaign.type),
      hashtags: apiCampaign.hashtags || [],
      keywords: apiCampaign.keywords || [],
      mentions: apiCampaign.mentions || [],
      dataSources: apiCampaign.dataSources || ['twitter'],
      startDate: apiCampaign.startDate,
      endDate: apiCampaign.endDate,
      languages: apiCampaign.languages || [],
      maxTweets: apiCampaign.maxTweets || 10, // Default value, API no tiene este campo
      sentimentAnalysis: true, // Default value, API no tiene este campo
      createdBy: 'system', // Default value, API no tiene este campo
      createdAt: apiCampaign.createdAt,
      updatedAt: new Date(), // Default value, API no tiene este campo
      organizationId: apiCampaign.organizationId ?? 'default-org-id', // Aseguramos tener un valor por defecto
      stats: apiCampaign.stats
        ? {
            totalTweets: apiCampaign.stats.totalTweets,
            totalEngagement: apiCampaign.stats.engagementRate * 100, // Convertir tasa a valor total
            avgSentiment: apiCampaign.stats.averageSentiment,
            sentimentDistribution: apiCampaign.stats.sentimentDistribution,
            topHashtags: [],
            topMentions: [],
            topKeywords: [],
            influencers: [],
          }
        : undefined,
    };
  }
  /**
   * Convierte una campaña del estado global al formato usado por la API
   */
  static fromStateToApi(
    stateCampaign: AppStateCampaign
  ): Partial<ApiCampaignExtended> & { organizationId?: string } {
    // Conversión de fechas para asegurar compatibilidad
    const startDate =
      stateCampaign.startDate instanceof Date
        ? stateCampaign.startDate
        : new Date(stateCampaign.startDate as string);

    const endDate =
      stateCampaign.endDate instanceof Date
        ? stateCampaign.endDate
        : new Date(stateCampaign.endDate as string);

    const createdAt =
      stateCampaign.createdAt instanceof Date
        ? stateCampaign.createdAt
        : new Date(stateCampaign.createdAt as string);

    return {
      id: stateCampaign.id,
      name: stateCampaign.name,
      description: stateCampaign.description || '',
      type: this.mapStateType(stateCampaign.type),
      status: this.mapStateStatus(stateCampaign.status),
      hashtags: stateCampaign.hashtags,
      keywords: stateCampaign.keywords,
      startDate: startDate,
      endDate: endDate,
      createdAt: createdAt,
      organizationId: stateCampaign.organizationId || 'default-org-id', // Aseguramos que se envíe el organizationId
      stats: stateCampaign.stats
        ? {
            totalTweets: stateCampaign.stats.totalTweets,
            averageSentiment: stateCampaign.stats.avgSentiment,
            sentimentDistribution: stateCampaign.stats.sentimentDistribution,
            engagementRate: stateCampaign.stats.totalEngagement / 100, // Convertir total a tasa
            reachEstimate: 0,
            lastUpdated: new Date(),
          }
        : undefined,
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
      updatedAt: new Date(),
    };
  }

  /**
   * Convierte una campaña del request al formato usado por la API
   */
  static fromRequestToApi(
    request: CampaignRequest,
    userId?: string
  ): any {
    // Estructura exacta que espera el backend
    const payload: any = {
      name: request.name,
      description: request.description,
      type: this.mapRequestType(request.type),
      status: 'draft',
      dataSources: request.dataSources || ['twitter'],
      hashtags: request.hashtags || [],
      keywords: request.keywords || [],
      mentions: request.mentions || [],
      startDate: new Date(request.startDate).toISOString(),
      endDate: new Date(request.endDate).toISOString(),
      maxTweets: request.maxTweets || 1000,
      collectImages: !!request.collectImages,
      collectVideos: !!request.collectVideos,
      collectReplies: !!request.collectReplies,
      collectRetweets: !!request.collectRetweets,
      languages: Array.isArray(request.languages) ? request.languages : [request.languages || 'en'],
      sentimentAnalysis: !!request.sentimentAnalysis,
      emotionAnalysis: !!request.emotionAnalysis,
      topicsAnalysis: !!request.topicsAnalysis,
      influencerAnalysis: !!request.influencerAnalysis,
      organizationId: request.organizationId || 'org-default-id'
    };

    // Incluir userId si se proporciona
    if (userId) {
      payload.userId = userId;
    }

    return payload;
  }
  private static mapApiStatus(status: string): AppStateCampaign['status'] {
    switch (status) {
      case 'active':
        return 'active';
      case 'paused':
        return 'paused';
      case 'completed':
        return 'completed';
      case 'draft':
      default:
        return 'inactive';
    }
  }

  private static mapStateStatus(status: string): ApiCampaign['status'] {
    switch (status) {
      case 'active':
        return 'active';
      case 'paused':
        return 'paused';
      case 'completed':
        return 'completed';
      case 'inactive':
      default:
        return 'draft';
    }
  }

  private static mapApiType(type: string): AppStateCampaign['type'] {
    switch (type) {
      case 'hashtag':
        return 'hashtag';
      case 'competitor':
        return 'user';
      case 'mention':
        return 'mention';
      case 'keyword':
      default:
        return 'keyword';
    }
  }

  private static mapStateType(type: string): string {
    // Usar los mismos valores que espera la API
    switch (type) {
      case 'hashtag':
        return 'hashtag';
      case 'user':
        return 'mention';
      case 'mention':
        return 'mention';
      case 'keyword':
      default:
        return 'keyword';
    }
  }

  private static mapRequestType(type: string): string {
    // La API espera los tipos directamente: "mention", "hashtag", "keyword", etc.
    switch (type) {
      case 'hashtag':
        return 'hashtag';
      case 'user':
        return 'mention'; // user campaigns se mapean a mention
      case 'keyword':
        return 'keyword';
      case 'custom':
      default:
        return 'hashtag';
    }
  }
}
