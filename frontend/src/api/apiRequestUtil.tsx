import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_FASTAPI_BASE_URL || '';
const API_VERSION = import.meta.env.VITE_API_VERSION_STR || '';
const API_TIMEOUT_MS = Number(import.meta.env.VITE_FASTAPI_TIMEOUT_MS) || 5000;

// Define allowed HTTP methods
type HttpMethod = 'get' | 'post' | 'put' | 'delete';

// Strongly type the function signature
export const apiRequest = async <T = any>(
  method: HttpMethod,
  endpoint: string,
  data: unknown = null,
  config?: AxiosRequestConfig
): Promise<T> => {
  try {
    const url = `${BASE_URL}${API_VERSION}${endpoint}`;

    // Default config if none provided
    const requestConfig: AxiosRequestConfig = config ?? {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: API_TIMEOUT_MS,
    };

    // Map methods to axios calls
    const methods: Record<HttpMethod, () => Promise<any>> = {
      get: () => axios.get(url, requestConfig),
      post: () => axios.post(url, data, requestConfig),
      put: () => axios.put(url, data, requestConfig),
      delete: () => axios.delete(url, requestConfig),
    };

    const response = await methods[method]();
    return response.data as T;

  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error(
          `HTTP error occurred: ${error.response.status} ${error.response.statusText}`
        );
        try {
          console.error(
            'Response content:',
            JSON.stringify(error.response.data, null, 4)
          );
        } catch {
          console.error('Response content:', error.response.data);
        }
      } else {
        console.error('Axios error occurred:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
};