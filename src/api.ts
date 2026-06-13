/**
 * API Url resolution helper.
 * Resolves static relative endpoints into dynamic remote endpoints when VITE_API_URL is populated.
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = ((import.meta as any).env?.VITE_API_URL as string) || '';
  const cleanBase = baseUrl.trim().replace(/\/$/, '');
  const cleanEndpoint = endpoint.trim().replace(/^\//, '');
  return cleanBase ? `${cleanBase}/${cleanEndpoint}` : `/${cleanEndpoint}`;
};
