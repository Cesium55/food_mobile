import { StandardModal } from '@/components/ui/StandardModal';
import React, { createContext, ReactNode, useContext, useState } from 'react';

interface ModalContextType {
  openModal: (content: ReactNode, footer?: ReactNode) => void;
  closeModal: () => void;
  isOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<ReactNode>(null);
  const [footer, setFooter] = useState<ReactNode>(null);

  const openModal = (modalContent: ReactNode, modalFooter?: ReactNode) => {
    setContent(modalContent);
    setFooter(modalFooter || null);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    // Очищаем контент после закрытия анимации
    setTimeout(() => {
      setContent(null);
      setFooter(null);
    }, 300);
  };

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      <StandardModal
        visible={isOpen}
        onClose={closeModal}
        footer={footer}
      >
        {content}
      </StandardModal>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
