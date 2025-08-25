export interface UserLookupRequest {
  email?: string;
  password?: string;
}
export interface UserLookupResponse {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  is_verified?: boolean;
  role?: string;
}

export interface UserCreateRequest {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  organization?: string;
}

export interface UserResponse {
  id?: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  organization?: string;
  isVerified?: boolean;
  verificationToken?: string;
  magicLinkToken?: string;
  magicLinkExpiresAt?: string;   
  registeredAt?: string;
  lastLoginAt?: string;
  role?: string;
}