import { useState } from 'react';

export interface Seller {
  id: number;
  full_name: string;
  short_name: string;
  inn: string;
  type: number;
  ogrn: string;
  master_id: number;
  status: number;
  verification_level: number;
  registration_doc_url: string;
  balance: number;
}

export const useSellers = () => {
  const [sellers] = useState<Seller[]>([
    {
      id: 1,
      full_name: 'ООО "Продукты и напитки"',
      short_name: 'Продукты',
      inn: '7743013902',
      type: 1,
      ogrn: '1234567890123',
      master_id: 1,
      status: 1,
      verification_level: 2,
      registration_doc_url: 'https://example.com/docs/seller1.pdf',
      balance: 150000.50,
    },
    {
      id: 2,
      full_name: 'ИП Иванов Иван Иванович',
      short_name: 'ИП Иванов',
      inn: '123456789012',
      type: 2,
      ogrn: '3214567890123',
      master_id: 2,
      status: 1,
      verification_level: 1,
      registration_doc_url: 'https://example.com/docs/seller2.pdf',
      balance: 75000.00,
    },
    {
      id: 3,
      full_name: 'ООО "Свежие овощи"',
      short_name: 'Овощи',
      inn: '7745123456',
      type: 1,
      ogrn: '1234567890124',
      master_id: 1,
      status: 1,
      verification_level: 3,
      registration_doc_url: 'https://example.com/docs/seller3.pdf',
      balance: 220000.00,
    },
    {
      id: 4,
      full_name: 'ИП Петров Петр Петрович',
      short_name: 'ИП Петров',
      inn: '234567890123',
      type: 2,
      ogrn: '3214567890124',
      master_id: 3,
      status: 1,
      verification_level: 2,
      registration_doc_url: 'https://example.com/docs/seller4.pdf',
      balance: 95000.75,
    },
    {
      id: 5,
      full_name: 'ООО "Мясная лавка"',
      short_name: 'Мясная лавка',
      inn: '7746234567',
      type: 1,
      ogrn: '1234567890125',
      master_id: 2,
      status: 1,
      verification_level: 2,
      registration_doc_url: 'https://example.com/docs/seller5.pdf',
      balance: 180500.25,
    },
    {
      id: 6,
      full_name: 'ИП Сидорова Анна Викторовна',
      short_name: 'ИП Сидорова',
      inn: '345678901234',
      type: 2,
      ogrn: '3214567890125',
      master_id: 4,
      status: 2,
      verification_level: 1,
      registration_doc_url: 'https://example.com/docs/seller6.pdf',
      balance: 45000.00,
    },
    {
      id: 7,
      full_name: 'ООО "Хлебопекарня №1"',
      short_name: 'Хлебопекарня',
      inn: '7747345678',
      type: 1,
      ogrn: '1234567890126',
      master_id: 1,
      status: 1,
      verification_level: 3,
      registration_doc_url: 'https://example.com/docs/seller7.pdf',
      balance: 310000.00,
    },
    {
      id: 8,
      full_name: 'ИП Кузнецов Алексей Сергеевич',
      short_name: 'ИП Кузнецов',
      inn: '456789012345',
      type: 2,
      ogrn: '3214567890126',
      master_id: 5,
      status: 1,
      verification_level: 2,
      registration_doc_url: 'https://example.com/docs/seller8.pdf',
      balance: 125000.50,
    },
    {
      id: 9,
      full_name: 'ООО "Молочные продукты"',
      short_name: 'Молочка',
      inn: '7748456789',
      type: 1,
      ogrn: '1234567890127',
      master_id: 2,
      status: 1,
      verification_level: 2,
      registration_doc_url: 'https://example.com/docs/seller9.pdf',
      balance: 195000.80,
    },
    {
      id: 10,
      full_name: 'ИП Морозов Дмитрий Александрович',
      short_name: 'ИП Морозов',
      inn: '567890123456',
      type: 2,
      ogrn: '3214567890127',
      master_id: 6,
      status: 0,
      verification_level: 0,
      registration_doc_url: 'https://example.com/docs/seller10.pdf',
      balance: 10000.00,
    },
  ]);

  const getSellerById = (id: number): Seller | undefined => {
    return sellers.find(seller => seller.id === id);
  };

  const getSellersByStatus = (status: number): Seller[] => {
    return sellers.filter(seller => seller.status === status);
  };

  const getSellersByVerificationLevel = (level: number): Seller[] => {
    return sellers.filter(seller => seller.verification_level === level);
  };

  return {
    sellers,
    getSellerById,
    getSellersByStatus,
    getSellersByVerificationLevel,
  };
};



