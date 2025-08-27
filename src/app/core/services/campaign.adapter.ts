import { Campaign as StateCampaign } from '../state/app.state';
import { Campaign as TypeCampaign, CampaignType } from '../types';

/**
 * Adaptador para convertir entre los diferentes tipos de Campaign
 */
export class CampaignAdapter {
  /**
   * Convierte el tipo Campaign de la API al formato del estado
   */
  static fromApiToState(apiCampaign: TypeCampaign): StateCampaign {
    return {
      ...apiCampaign,
      organizationId: apiCampaign.organizationId || 'default-org', // Asegura que siempre haya un valor
      type: apiCampaign.type as StateCampaign['type'], // Adaptación específica del tipo
      createdAt: apiCampaign.createdAt,
      startDate: apiCampaign.startDate,
      endDate: apiCampaign.endDate,
      updatedAt: apiCampaign.updatedAt || new Date()
    };
  }

  /**
   * Convierte una colección de Campaign de la API al formato del estado
   */
  static fromApiArrayToStateArray(apiCampaigns: TypeCampaign[]): StateCampaign[] {
    return apiCampaigns.map(campaign => this.fromApiToState(campaign));
  }

  /**
   * Convierte el tipo Campaign del estado al formato de la API
   */
  static fromStateToApi(stateCampaign: StateCampaign): TypeCampaign {
    const campaignType = this.mapToCampaignType(stateCampaign.type);
    
    return {
      ...stateCampaign,
      type: campaignType,
      // Asegurarse de que las fechas sean instancias de Date
      startDate: stateCampaign.startDate instanceof Date ? 
        stateCampaign.startDate : 
        new Date(stateCampaign.startDate as string),
      endDate: stateCampaign.endDate instanceof Date ? 
        stateCampaign.endDate : 
        new Date(stateCampaign.endDate as string),
      createdAt: stateCampaign.createdAt instanceof Date ? 
        stateCampaign.createdAt : 
        new Date(stateCampaign.createdAt as string),
      updatedAt: stateCampaign.updatedAt instanceof Date ? 
        stateCampaign.updatedAt : 
        new Date(stateCampaign.updatedAt as string)
    };
  }

  /**
   * Mapea el tipo string del estado a uno de los tipos específicos de CampaignType
   */
  private static mapToCampaignType(type: string): CampaignType {
    switch(type) {
      case 'hashtag': return 'hashtag';
      case 'user': return 'user';
      case 'keyword': return 'keyword';
      case 'mention': return 'mention';
      default: return 'keyword'; // Valor por defecto
    }
  }
}
