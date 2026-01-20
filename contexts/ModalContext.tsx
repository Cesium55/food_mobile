import { StandardModal } from '@/components/ui';
import { BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import React, { createContext, ReactNode, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface ModalItem {
  content: ReactNode;
  footer?: ReactNode;
  id: string; // Уникальный ID для каждой модалки
}

interface ModalContextType {
  openModal: (content: ReactNode, footer?: ReactNode) => void;
  closeModal: () => void;
  closeAllModals: () => void;
  isOpen: boolean;
  getModalIndex?: (modalId: string) => number; // Функция для получения индекса модалки
  getTotalModals?: () => number; // Функция для получения общего количества модалок
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);
const ModalItemContext = createContext<{ isTopModal: boolean; modalId: string } | undefined>(undefined);

// Компонент-обертка для модалки, который использует стабильный контекст
// Мемоизирован, чтобы не перерендериваться при изменении других модалок
const ModalItemWrapper = React.memo(function ModalItemWrapper({ 
  modal, 
  index, 
  isTopModalProp,
  closeModal 
}: { 
  modal: ModalItem; 
  index: number; 
  isTopModalProp: boolean;
  closeModal: () => void;
}) {
  const zIndexValue = 1000 + index;
  
  // Запоминаем начальное значение isTopModal и не меняем его после монтирования
  // Это предотвращает перерендер контента при изменении стека
  const isTopModalRef = useRef(isTopModalProp);
  const wasTopModalRef = useRef(isTopModalProp);
  
  // Обновляем только для управления pointerEvents и onClose, но не для контекста
  // Контекст остается стабильным, чтобы не вызывать перерендер потребителей
  if (isTopModalProp !== wasTopModalRef.current) {
    wasTopModalRef.current = isTopModalProp;
    // Обновляем pointerEvents и onClose, но контекст остается стабильным
  }
  
  // Создаем стабильный объект контекста один раз при монтировании компонента
  // Используем useRef, чтобы объект не пересоздавался при перерендерах
  const contextValueRef = useRef<{ isTopModal: boolean; modalId: string } | null>(null);
  if (!contextValueRef.current) {
    contextValueRef.current = { isTopModal: isTopModalRef.current, modalId: modal.id };
  }
  // НЕ обновляем contextValueRef.current.isTopModal - оставляем стабильным
  
  // Логируем изменения isTopModal для отладки
  if (isTopModalProp !== wasTopModalRef.current) {
    console.log(`[ModalItemWrapper] Modal ${modal.id} isTopModal changed from ${wasTopModalRef.current} to ${isTopModalProp}`);
  }
  
  return (
    <ModalItemContext.Provider value={contextValueRef.current}>
      <View 
        style={[
          styles.modalContainer,
          { 
            zIndex: zIndexValue,
            elevation: zIndexValue, // Для Android
          }
        ]}
        pointerEvents={isTopModalProp ? 'auto' : 'none'}
        collapsable={false}
      >
        <StandardModal
          visible={true} // Всегда true, чтобы не было анимации при переключении
          onClose={isTopModalProp ? closeModal : () => {}} // Только верхняя может закрываться
          footer={modal.footer}
          zIndex={zIndexValue}
          isTopModal={isTopModalProp} // Передаем флаг, чтобы управлять видимостью внутри
        >
          {/* Контент модалки получает isTopModal через контекст, а не через props */}
          {modal.content}
        </StandardModal>
      </View>
    </ModalItemContext.Provider>
  );
}, (prevProps, nextProps) => {
  // Возвращаем true если НЕ нужно перерендеривать (пропсы не изменились)
  // НЕ перерендериваем при изменении isTopModal - это только для управления pointerEvents
  // Контент модалки не должен перерендериваться при изменении стека
  return (
    prevProps.modal.id === nextProps.modal.id &&
    prevProps.modal.content === nextProps.modal.content &&
    prevProps.modal.footer === nextProps.modal.footer &&
    prevProps.index === nextProps.index &&
    prevProps.closeModal === nextProps.closeModal
    // НЕ сравниваем isTopModal - позволяем обновлять pointerEvents без перерендера контента
  );
});

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modals, setModals] = useState<ModalItem[]>([]);
  const modalIdCounterRef = React.useRef<number>(0);

  const openModal = useCallback((modalContent: ReactNode, modalFooter?: ReactNode) => {
    setModals(prev => {
      const modalId = `modal-${modalIdCounterRef.current++}`;
      const newModals = [...prev, { content: modalContent, footer: modalFooter, id: modalId }];
      console.log(`[ModalContext] Opening modal ${modalId}. Total modals: ${newModals.length}, Previous modals: ${prev.length}`);
      return newModals;
    });
  }, []);

  const closeModal = useCallback(() => {
    setModals(prev => {
      if (prev.length === 0) return prev;
      const newModals = [...prev];
      const closedModal = newModals.pop();
      console.log(`[ModalContext] Closing modal ${closedModal?.id}. Remaining modals: ${newModals.length}, Previous modals: ${prev.length}`);
      return newModals;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setModals([]);
  }, []);

  const isOpen = modals.length > 0;
  const currentModal = modals[modals.length - 1] || null;
  
  const getModalIndex = (modalId: string) => {
    return modals.findIndex(m => m.id === modalId);
  };
  
  const getTotalModals = () => modals.length;

  return (
    <ModalContext.Provider value={{ openModal, closeModal, closeAllModals, isOpen, getModalIndex, getTotalModals }}>
      {children}
      {/* Глобальный backdrop - показывается, пока есть хотя бы одна модалка */}
      {modals.length > 0 && (
        <View 
          style={[
            styles.modalContainer,
            { 
              zIndex: 999, // Ниже всех модалок, но выше контента
              elevation: 999,
            }
          ]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => {
              // Закрываем только верхнюю модалку при клике на backdrop
              if (modals.length > 0) {
                closeModal();
              }
            }}
          />
        </View>
      )}
      {/* Рендерим все модалки, но только верхняя видна и интерактивна */}
      {modals.map((modal, index) => (
        <ModalItemWrapper
          key={modal.id}
          modal={modal}
          index={index}
          isTopModalProp={index === modals.length - 1}
          closeModal={closeModal}
        />
      ))}
    </ModalContext.Provider>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}

export function useModalItem() {
  const context = useContext(ModalItemContext);
  return context; // Может быть undefined, если компонент не внутри модалки
}
