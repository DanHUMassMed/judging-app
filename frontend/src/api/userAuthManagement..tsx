import { apiRequest } from "./apiRequestUtil.js";
import type { UserResponse, UserCreate } from "../types";

// Example: typed enrichment
export const registerUser = async (
  userCreate: UserCreate
): Promise<UserResponse> => {
  return apiRequest<UserResponse>(
    "post",
    `/authenticate_user`,
    userCreate
  );
};

