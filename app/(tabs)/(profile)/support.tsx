import { ProfileScreenWrapper } from '@/components/profile/ProfileScreenWrapper';
import { IconSymbol } from '@/components/ui/icon-symbol';
import {
  SupportMessage,
  SupportWsServerEvent,
  getMasterSupportChat,
  markSupportMessagesRead,
  openSupportWebSocket,
  sendSupportMessage,
} from '@/services/supportService';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

function sortMessages(messages: SupportMessage[]): SupportMessage[] {
  return [...messages].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return aTime - bTime;
  });
}

function mergeMessages(current: SupportMessage[], next: SupportMessage[]): SupportMessage[] {
  const map = new Map<number, SupportMessage>();
  for (const item of current) map.set(item.id, item);
  for (const item of next) map.set(item.id, item);
  return sortMessages(Array.from(map.values()));
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function formatMessageDateTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  if (isToday(date)) {
    return `${hours}:${minutes}`;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export default function SupportScreen() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unmountedRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const unreadIncomingCount = useMemo(() => {
    return messages.filter((item) => item.sender_type !== 'user' && !item.is_read).length;
  }, [messages]);

  const clearSocketArtifacts = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const markIncomingRead = useCallback(async () => {
    if (unreadIncomingCount === 0) return;

    try {
      await markSupportMessagesRead();
      setMessages((prev) =>
        prev.map((item) => (item.sender_type !== 'user' ? { ...item, is_read: true } : item))
      );

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'mark_read' }));
      }
    } catch {
      // no-op
    }
  }, [unreadIncomingCount]);

  const handleWsEvent = useCallback((eventData: SupportWsServerEvent) => {
    if (eventData.event === 'chat_state') {
      setMessages((prev) => mergeMessages(prev, eventData.messages || []));
      return;
    }

    if (eventData.event === 'new_message') {
      setMessages((prev) => mergeMessages(prev, [eventData.message]));
      return;
    }

    if (eventData.event === 'messages_read') {
      setMessages((prev) =>
        prev.map((item) => (item.sender_type !== 'user' ? { ...item, is_read: true } : item))
      );
      return;
    }

    if (eventData.event === 'error') {
      setErrorText(eventData.detail || 'Ошибка канала поддержки');
    }
  }, []);

  const connectWs = useCallback(async () => {
    try {
      const ws = await openSupportWebSocket();
      wsRef.current = ws;

      ws.onopen = () => {
        setErrorText(null);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ action: 'ping' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data as string) as SupportWsServerEvent;
          handleWsEvent(parsed);
        } catch {
          // no-op
        }
      };

      ws.onclose = () => {
        clearSocketArtifacts();
        if (!unmountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWs();
          }, 3000);
        }
      };
    } catch {
      if (!unmountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 3000);
      }
    }
  }, [clearSocketArtifacts, handleWsEvent]);

  const loadChat = useCallback(async () => {
    setLoading(true);
    setErrorText(null);
    try {
      const chat = await getMasterSupportChat();
      setMessages(sortMessages(chat.messages || []));
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Не удалось загрузить чат поддержки';
      setErrorText(text);
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    setSending(true);
    setErrorText(null);
    try {
      const created = await sendSupportMessage(text);
      setMessages((prev) => mergeMessages(prev, [created]));
      setInputValue('');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Не удалось отправить сообщение';
      setErrorText(text);
    } finally {
      setSending(false);
    }
  }, [inputValue, sending]);

  useEffect(() => {
    unmountedRef.current = false;
    loadChat();
    connectWs();

    return () => {
      unmountedRef.current = true;
      clearSocketArtifacts();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [clearSocketArtifacts, connectWs, loadChat]);

  useFocusEffect(
    useCallback(() => {
      markIncomingRead();
    }, [markIncomingRead])
  );

  useEffect(() => {
    markIncomingRead();
  }, [messages, markIncomingRead]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      }, 50);
    }
  }, [messages.length]);

  return (
    <ProfileScreenWrapper title="Поддержка" onRefresh={loadChat} refreshing={loading} useScrollView={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.messagesSection}>
          {loading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loaderText}>Загрузка чата...</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Напишите первый вопрос в поддержку</Text>
                </View>
              ) : (
                messages.map((item) => {
                  const isUserMessage = item.sender_type === 'user';
                  const isSystemMessage = item.sender_type === 'system';
                  const formattedDateTime = formatMessageDateTime(item.created_at);

                  if (isSystemMessage) {
                    return (
                      <View key={item.id} style={styles.systemMessageRow}>
                        <View style={styles.systemMessageBubble}>
                          <Text style={styles.systemMessageText}>{item.message_text}</Text>
                          <Text style={styles.systemMessageTime}>{formattedDateTime}</Text>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.messageRow,
                        isUserMessage ? styles.messageRowUser : styles.messageRowSupport,
                      ]}
                    >
                      <View
                        style={[
                          styles.messageBubble,
                          isUserMessage ? styles.messageBubbleUser : styles.messageBubbleSupport,
                        ]}
                      >
                        <Text style={isUserMessage ? styles.messageTextUser : styles.messageTextSupport}>
                          {item.message_text}
                        </Text>
                        <Text style={isUserMessage ? styles.messageTimeUser : styles.messageTimeSupport}>
                          {formattedDateTime}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>

        {!!errorText && <Text style={styles.errorText}>{errorText}</Text>}

        <View style={styles.inputContainer}>
          <TextInput
            value={inputValue}
            onChangeText={setInputValue}
            placeholder="Введите сообщение"
            style={styles.input}
            editable={!sending}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (sending || !inputValue.trim()) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={sending || !inputValue.trim()}
          >
            <IconSymbol name="paperplane.fill" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ProfileScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  messagesSection: {
    flex: 1,
    backgroundColor: '#eee',
    marginBottom: 88,
    overflow: 'hidden',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
  loaderText: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 14,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 14,
  },
  messageRow: {
    marginBottom: 8,
    flexDirection: 'row',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowSupport: {
    justifyContent: 'flex-start',
  },
  systemMessageRow: {
    marginBottom: 10,
    alignItems: 'center',
  },
  systemMessageBubble: {
    maxWidth: '88%',
    backgroundColor: '#7A7A7A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8F8F8F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  systemMessageText: {
    color: '#fff',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  systemMessageTime: {
    marginTop: 4,
    fontSize: 10,
    color: '#F5F5F5',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
  },
  messageBubbleUser: {
    backgroundColor: '#FF6B00',
    borderBottomRightRadius: 4,
  },
  messageBubbleSupport: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageTextUser: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  messageTextSupport: {
    color: '#111',
    fontSize: 15,
    lineHeight: 20,
  },
  messageTimeUser: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'right',
  },
  messageTimeSupport: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    paddingTop: 8,
    paddingBottom: 8,
  },
  inputContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    backgroundColor: '#fff',
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 130,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111',
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FF6B00',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
