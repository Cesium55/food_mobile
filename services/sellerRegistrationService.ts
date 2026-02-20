import { API_ENDPOINTS, HTTP_METHODS } from "@/constants/api";
import { getApiUrl } from "@/constants/env";
import { authFetch } from "@/utils/authFetch";

export type SellerRegistrationStatus = "pending" | "rejected" | "approved" | string;

export interface SellerRegistrationRequestPayload {
  full_name?: string | null;
  short_name?: string | null;
  description?: string | null;
  inn?: string | null;
  is_IP?: boolean | null;
  ogrn?: string | null;
  terms_accepted?: boolean;
}

export interface SellerRegistrationRequest {
  id: number;
  user_id: number;
  full_name: string | null;
  short_name: string | null;
  description: string | null;
  inn: string | null;
  is_IP: boolean | null;
  ogrn: string | null;
  status: SellerRegistrationStatus;
  terms_accepted: boolean;
  created_at: string;
  updated_at: string;
}

interface BindEmailResponse {
  message: string;
  user_id: number;
  email: string;
}

function extractData<T>(payload: any): T {
  return (payload?.data || payload) as T;
}

async function extractErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const json = await response.json();
    if (typeof json?.detail === "string") return json.detail;
    if (typeof json?.message === "string") return json.message;
    if (typeof json?.data?.detail === "string") return json.data.detail;
    if (typeof json?.data?.message === "string") return json.data.message;
  } catch {
    // no-op
  }

  try {
    const text = await response.text();
    if (text) return text;
  } catch {
    // no-op
  }

  return fallbackMessage;
}

export async function bindUserEmail(email: string): Promise<BindEmailResponse> {
  const response = await authFetch(getApiUrl(API_ENDPOINTS.AUTH.BIND_EMAIL), {
    method: HTTP_METHODS.POST,
    requireAuth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const errorMessage = await extractErrorMessage(response, "Не удалось привязать email");
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return extractData<BindEmailResponse>(json);
}

export async function getMySellerRegistrationRequest(): Promise<SellerRegistrationRequest | null> {
  const response = await authFetch(getApiUrl(API_ENDPOINTS.SELLERS.REGISTRATION_REQUEST), {
    method: HTTP_METHODS.GET,
    requireAuth: true,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorMessage = await extractErrorMessage(response, "Не удалось загрузить заявку продавца");
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return extractData<SellerRegistrationRequest>(json);
}

export async function createSellerRegistrationRequest(
  payload: SellerRegistrationRequestPayload
): Promise<SellerRegistrationRequest> {
  const response = await authFetch(getApiUrl(API_ENDPOINTS.SELLERS.REGISTRATION_REQUEST), {
    method: HTTP_METHODS.POST,
    requireAuth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMessage = await extractErrorMessage(response, "Не удалось создать заявку продавца");
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return extractData<SellerRegistrationRequest>(json);
}

export async function updateSellerRegistrationRequest(
  payload: SellerRegistrationRequestPayload
): Promise<SellerRegistrationRequest> {
  const response = await authFetch(getApiUrl(API_ENDPOINTS.SELLERS.REGISTRATION_REQUEST), {
    method: HTTP_METHODS.PUT,
    requireAuth: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorMessage = await extractErrorMessage(response, "Не удалось обновить заявку продавца");
    throw new Error(errorMessage);
  }

  const json = await response.json();
  return extractData<SellerRegistrationRequest>(json);
}
