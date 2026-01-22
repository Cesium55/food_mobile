import BottomSheet, { BottomSheetFooter, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface StandardModalProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  zIndex?: number;
  isTopModal?: boolean; // Флаг, указывающий, является ли эта модалка верхней в стеке
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export function StandardModal({ visible, onClose, children, footer, zIndex = 1000, isTopModal = true }: StandardModalProps) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const wasOpenedRef = useRef<boolean>(false); // Отслеживаем, была ли модалка уже открыта
  const previousIsTopModalRef = useRef<boolean>(isTopModal); // Отслеживаем предыдущее значение isTopModal
  
  // Используем числовое значение в пикселях для точного контроля высоты (90%)
  const modalHeight = SCREEN_HEIGHT * 0.9;
  const snapPoints = useMemo(() => [modalHeight], []);


  useEffect(() => {
    if (visible) {
      // Если модалка уже была открыта и просто стала верхней - не анимируем
      if (wasOpenedRef.current && previousIsTopModalRef.current !== isTopModal) {
        // Модалка уже открыта, просто обновляем флаг
        // Убеждаемся, что модалка остается в открытом состоянии без анимации
        console.log(`[StandardModal] isTopModal changed from ${previousIsTopModalRef.current} to ${isTopModal}, keeping modal open`);
        previousIsTopModalRef.current = isTopModal;
        // Принудительно устанавливаем индекс без анимации
        bottomSheetRef.current?.snapToIndex(0, { duration: 0 });
        return;
      }
      
      // Первое открытие модалки
      if (!wasOpenedRef.current) {
        console.log(`[StandardModal] First opening modal, isTopModal: ${isTopModal}`);
        wasOpenedRef.current = true;
        previousIsTopModalRef.current = isTopModal;
        bottomSheetRef.current?.expand();
      }
    } else {
      // Закрываем модалку
      console.log(`[StandardModal] Closing modal, isTopModal: ${isTopModal}`);
      wasOpenedRef.current = false;
      previousIsTopModalRef.current = isTopModal;
      bottomSheetRef.current?.close();
    }
  }, [visible, isTopModal]);

  const handleSheetChanges = useCallback((index: number) => {
    // Закрываем модалку только если она верхняя в стеке
    if (index === -1 && isTopModal) {
      onClose();
    }
  }, [onClose, isTopModal]);

  const renderBackdrop = useCallback(
    (props: any) => {
      // Backdrop теперь управляется глобально в ModalContext
      // Для всех модалок backdrop не нужен - он рендерится отдельно
      return null;
    },
    []
  );

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  // Рендерим footer используя BottomSheetFooter
  const renderFooter = useCallback(
    (props: any) => {
      if (!footer) return null;
      return (
        <BottomSheetFooter {...props} bottomInset={0}>
          <View style={styles.footerContainer}>
            {footer}
          </View>
        </BottomSheetFooter>
      );
    },
    [footer]
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={visible ? 0 : -1}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      enablePanDownToClose={isTopModal} // Только верхняя модалка может закрываться свайпом
      enableHandlePanningGesture={isTopModal} // Только верхняя модалка может управляться жестами
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handleIndicator}
      handleStyle={styles.handleContainer}
      backgroundStyle={[styles.bottomSheetBackground, { maxHeight: modalHeight }]}
      style={[styles.bottomSheet, { zIndex, elevation: zIndex }]}
      animateOnMount={!wasOpenedRef.current} // Анимация только при первом открытии
      enableDynamicSizing={false}
      maxDynamicContentSize={modalHeight}
      detached={false}
      enableContentPanningGesture={false} // Отключаем возможность двигать модалку через контент - только через handle
      footerComponent={renderFooter}
    >
      {/* Кнопка закрытия - фиксированная, не скроллится */}
      <View style={styles.closeButtonContainer} pointerEvents="box-none">
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="xmark" color="#666" size={18} />
        </TouchableOpacity>
      </View>

      {/* Контент модалки с прокруткой */}
      <BottomSheetScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
        bounces={true}
        overScrollMode="always"
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        enableOnAndroid={true}
        enableFooterMarginAdjustment={true} // Автоматически добавляет отступ для footer
      >
        {children}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheet: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  bottomSheetBackground: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleContainer: {
    paddingTop: 6,
    paddingBottom: 6,
    // backgroundColor: 'red'
  },
  handleIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    width: 40,
    height: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 64,
    paddingBottom: 20,
    paddingHorizontal: 0,
  },
  footerContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 8,
    right: 16,
    zIndex: 1000,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
  },
  closeButton: {
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
