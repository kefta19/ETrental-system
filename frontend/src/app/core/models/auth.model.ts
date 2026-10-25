export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phoneNumber: string;
  profilePictureUrl?: string | null;
  roles: string[];
  agencyId?: string | null;
  agencyName?: string | null;
  subscriptionTier: string;
}

export interface AuthResponse {
  token: string;
  expiration: string;
  refreshToken: string;
  user: User;
}

export interface ApiResponse<T> {
  succeeded: boolean;
  data: T;
  errors: string[];
}
