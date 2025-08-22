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
export interface UserResponse {
  id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  is_verified?: boolean;
  verification_token?: string;
  magic_link_token?: string;
  magic_link_expires_at?: string;   // use string for ISO datetime (from API)
  registered_at?: string;
  last_login_at?: string;
  role?: string;
}