/**
 * Repository Interfaces - Dependency Inversion Principle
 * Abstractions that define contracts for data access
 */

import { Observable } from 'rxjs';
import { 
  Campaign, 
  User, 
  PaginatedResponse, 
  ApiResponse 
} from '../types';

// Use existing interfaces from campaign.service
import { 
  CreateCampaignRequest, 
  UpdateCampaignRequest, 
  CampaignFilter 
} from '../services/campaign.service';

/**
 * Base Repository Interface
 * Generic contract for all repository implementations
 */
export interface IBaseRepository<T, TId = string> {
  getById(id: TId): Observable<ApiResponse<T>>;
  create(entity: any): Observable<ApiResponse<T>>;
  update(id: TId, entity: any): Observable<ApiResponse<T>>;
  delete(id: TId): Observable<ApiResponse<void>>;
}

/**
 * Campaign Repository Interface
 * Specific contract for campaign data operations
 */
export interface ICampaignRepository extends IBaseRepository<Campaign> {
  getAll(filter?: CampaignFilter, page?: number, pageSize?: number): Observable<ApiResponse<PaginatedResponse<Campaign>>>;
  start(id: string): Observable<ApiResponse<Campaign>>;
  stop(id: string): Observable<ApiResponse<Campaign>>;
  getStats(id: string): Observable<ApiResponse<any>>;
}

/**
 * User Repository Interface
 * Specific contract for user data operations
 */
export interface IUserRepository extends IBaseRepository<User> {
  getByEmail(email: string): Observable<ApiResponse<User>>;
  updateProfile(id: string, profile: Partial<User>): Observable<ApiResponse<User>>;
  changePassword(id: string, oldPassword: string, newPassword: string): Observable<ApiResponse<void>>;
}

/**
 * Authentication Repository Interface
 * Contract for authentication operations
 */
export interface IAuthRepository {
  login(credentials: { username: string; password: string }): Observable<any>;
  logout(): Observable<void>;
  refreshToken(): Observable<any>;
  validateToken(): Observable<boolean>;
}
