import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface PaymentWebViewProps {
  visible: boolean;
  confirmationUrl: string;
  onPaymentSuccess: (paymentId: number) => void;
  onPaymentCanceled: (paymentId: number) => void;
  onClose: () => void;
}

interface PaymentStatusMessage {
  type: 'payment_status';
  status: 'succeeded' | 'canceled';
  payment_id: number;
  purchase_id?: number;
}

export function PaymentWebView({
  visible,
  confirmationUrl,
  onPaymentSuccess,
  onPaymentCanceled,
  onClose,
}: PaymentWebViewProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message: PaymentStatusMessage = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'payment_status') {
        if (message.status === 'succeeded') {
          // Закрываем модалку при успешном платеже
          onClose();
          // Вызываем callback для обработки успешного платежа
          onPaymentSuccess(message.payment_id);
        } else if (message.status === 'canceled') {
          // Закрываем модалку при отмене платежа
          onClose();
          // Вызываем callback для обработки отмены платежа
          onPaymentCanceled(message.payment_id);
        }
      }
    } catch (error) {
      console.error('Ошибка парсинга сообщения от WebView:', error);
    }
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    Alert.alert(
      'Ошибка загрузки',
      'Не удалось загрузить страницу оплаты. Проверьте подключение к интернету.',
      [
        {
          text: 'Закрыть',
          onPress: onClose,
        },
      ]
    );
  };

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Оплата заказа</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: confirmationUrl }}
          style={styles.webview}
          onMessage={handleMessage}
          onLoadStart={handleLoadStart}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={[styles.loadingText, { color: colors.text }]}>
                Загрузка страницы оплаты...
              </Text>
            </View>
          )}
        />

        {/* Loading overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Загрузка...
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    paddingTop: 60, // Для safe area на iOS
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '300',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});


