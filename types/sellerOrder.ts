import { SellerPurchaseFulfillmentStatus, SellerPurchaseStatus } from '@/services/orderService';

export type SellerOrderStatus =
  | SellerPurchaseStatus
  | 'partially_fulfilled'
  | 'fulfilled';

export interface SellerOrderItem {
  id: number;
  purchaseOfferId: number | null;
  offerId: number;
  productName: string;
  quantity: number;
  price: string;
  shopId: number | null;
  shopName: string;
  shopAddress?: string;
  fulfillmentStatus: SellerPurchaseFulfillmentStatus;
  fulfilledQuantity: number | null;
  unfulfilledReason: string | null;
  purchaseOfferResultId: number | null;
  refundedQuantity: number;
  moneyFlowStatus: 'at_user' | 'in_system' | 'at_seller' | string | null;
}

export interface SellerOrder {
  id: number;
  date: Date;
  status: SellerOrderStatus;
  apiStatus: SellerPurchaseStatus;
  customerId: number;
  totalAmount: number;
  items: SellerOrderItem[];
  shopIds: number[];
  shopNames: string[];
}
