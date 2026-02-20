import { API_ENDPOINTS, HTTP_METHODS } from '@/constants/api';
import { getApiUrl } from '@/constants/env';
import { authFetch } from '@/utils/authFetch';
import { getTokens } from '@/utils/storage';

export type SupportSenderType = 'user' | 'manager' | 'system' | string;

export interface SupportMessage {
  id: number;
  user_id: number;
  sender_type: SupportSenderType;
  is_read: boolean;
  message_text: string;
  created_at: string;
  updated_at: string;
}

export interface SupportChat {
  user_id: number;
  is_closed: boolean;
  created_at: string;
  updated_at: string;
  messages: SupportMessage[];
}

export interface SupportChatStateEvent {
  event: 'chat_state';
  chat: Omit<SupportChat, 'messages'>;
  messages: SupportMessage[];
}

export interface SupportNewMessageEvent {
  event: 'new_message';
  message: SupportMessage;
}

export interface SupportMessagesReadEvent {
  event: 'messages_read';
  updated_count: number;
}

export interface SupportPongEvent {
  event: 'pong';
}

export interface SupportErrorEvent {
  event: 'error';
  detail: string;
}

export type SupportWsServerEvent =
  | SupportChatStateEvent
  | SupportNewMessageEvent
  | SupportMessagesReadEvent
  | SupportPongEvent
  | SupportErrorEvent;

function extractData<T>(payload: any): T {
  return (payload?.data || payload) as T;
}

function createEmptySupportChat(): SupportChat {
  const now = new Date().toISOString();
  return {
    user_id: 0,
    is_closed: false,
    created_at: now,
    updated_at: now,
    messages: [],
  };
}

export async function getMasterSupportChat(): Promise<SupportChat> {
  const response = await authFetch(getApiUrl(API_ENDPOINTS.SUPPORT.MASTER_CHAT), {
    method: HTTP_METHODS.GET,
    requireAuth: true,
  });

  if (!response.ok) {
    if (response.status === 404) {
      return createEmptySupportChat();
    }
    const errorText = await response.text();
    throw new Error(`Ошибка загрузки чата поддержки: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const chat = extractData<SupportChat>(json);

  return {
    ...chat,
    messages: Array.isArray(chat.messages) ? chat.messages : [],
  };
}

export async function sendSupportMessage(messageText: string): Promise<SupportMessage> {
  const response = await authFetch(getApiUrl(API_ENDPOINTS.SUPPORT.MESSAGES), {
    method: HTTP_METHODS.POST,
    requireAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message_text: messageText }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка отправки сообщения: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  return extractData<SupportMessage>(json);
}

export async function markSupportMessagesRead(): Promise<number> {
  const response = await authFetch(getApiUrl(API_ENDPOINTS.SUPPORT.MARK_READ), {
    method: HTTP_METHODS.POST,
    requireAuth: true,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ошибка отметки сообщений: ${response.status} ${errorText}`);
  }

  const json = await response.json();
  const payload = extractData<{ updated_count?: number }>(json);
  return payload.updated_count || 0;
}

function toWsUrl(endpoint: string): string {
  const httpUrl = getApiUrl(endpoint);
  if (httpUrl.startsWith('https://')) return httpUrl.replace('https://', 'wss://');
  if (httpUrl.startsWith('http://')) return httpUrl.replace('http://', 'ws://');
  return httpUrl;
}

export async function openSupportWebSocket(): Promise<WebSocket> {
  const { accessToken } = await getTokens();
  if (!accessToken) {
    throw new Error('Токен авторизации не найден');
  }

  const wsUrl = toWsUrl(API_ENDPOINTS.SUPPORT.WS);
  const WsCtor = WebSocket as any;

  return new WsCtor(wsUrl, undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
