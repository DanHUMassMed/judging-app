import { apiRequest } from "./apiRequestUtil.js";
import type { UserLookupRequest, UserLookupResponse } from "../types";

// Example: typed enrichment
export const analyze_and_visualize_enrichment = async (
  userLookupRequest: UserLookupRequest
): Promise<UserLookupResponse> => {
  return apiRequest<UserLookupResponse>(
    "post",
    `/authenticate_user`,
    userLookupRequest
  );
};

