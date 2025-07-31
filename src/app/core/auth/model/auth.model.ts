export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      displayName: string;
      avatar: string | null;
      role: string;
      permissions: string[];
      isActive: boolean;
      isVerified: boolean;
      createdAt: string;
      updatedAt: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
  message: string;
}

export interface UserInfo {
  email: string;
  username: string;
  role: string;
  displayName?: string;
  id?: string;
  permissions?: string[];
}

export interface AuthState {
  isAuthenticated: boolean;
  user: UserInfo | null;
  token: string | null;
}