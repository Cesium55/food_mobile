import { IconSymbol } from '@/components/ui/icon-symbol';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Modal from 'react-native-modal';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

interface PaymentWebViewProps {
  visible: boolean;
  confirmationUrl: string;
  purchaseId?: number;
  paymentId?: number;
  onPaymentSuccess: (paymentId: number) => void;
  onPaymentCanceled: (paymentId: number) => void;
  onClose: () => void;
  onCloseWithCheck?: (purchaseId: number, paymentId: number) => void;
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
  purchaseId,
  paymentId,
  onPaymentSuccess,
  onPaymentCanceled,
  onClose,
  onCloseWithCheck,
}: PaymentWebViewProps) {
  const [loading, setLoading] = useState(true);
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const message: PaymentStatusMessage = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'payment_status') {
        if (message.status === 'succeeded') {
          // Закрываем модалку при успешном платеже (без проверки, так как статус уже известен)
          onClose();
          // Вызываем callback для обработки успешного платежа
          onPaymentSuccess(message.payment_id);
        } else if (message.status === 'canceled') {
          // Закрываем модалку при отмене платежа (без проверки)
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

  const handleClose = () => {
    // Если есть onCloseWithCheck и purchaseId/paymentId, проверяем статус
    if (onCloseWithCheck && purchaseId && paymentId) {
      onCloseWithCheck(purchaseId, paymentId);
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      onSwipeComplete={handleClose}
      swipeDirection="down"
      style={styles.modal}
      avoidKeyboard={true}
    >
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Оплата заказа</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="xmark" color="#333" />
          </TouchableOpacity>
        </View>

        {/* WebView */}
        <View style={styles.webviewContainer}>
          <WebView
            ref={webViewRef}
            source={{ uri: confirmationUrl }}
            style={styles.webview}
            onMessage={handleMessage}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={styles.loadingText}>
                  Загрузка страницы оплаты...
                </Text>
              </View>
            )}
          />

          {/* Loading overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4CAF50" />
              <Text style={styles.loadingText}>
                Загрузка...
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
  },
  webviewContainer: {
    flex: 1,
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
    color: '#666',
  },
});


