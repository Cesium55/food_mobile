import { SellerPurchase, SellerPurchaseFulfillmentStatus } from '@/services/orderService';
import { Shop } from '@/hooks/useShops';
import { Offer } from '@/hooks/useOffers';
import { SellerOrder, SellerOrderItem, SellerOrderStatus } from '@/types/sellerOrder';

function deriveOrderStatus(purchase: SellerPurchase): SellerOrderStatus {
  if (purchase.status === 'cancelled') {
    return 'cancelled';
  }

  if (purchase.purchase_offers.length === 0) {
    return purchase.status;
  }

  const statuses = purchase.purchase_offers.map((offer) => offer.fulfillment_status);
  const allFulfilled = statuses.every((status) => status === 'fulfilled');
  const hasAnyFulfillment = statuses.some(
    (status) => status === 'fulfilled' || status === 'not_fulfilled'
  );

  if (allFulfilled) {
    return 'fulfilled';
  }

  if (hasAnyFulfillment) {
    return 'partially_fulfilled';
  }

  return purchase.status;
}

export function getFulfillmentStatusLabel(status: SellerPurchaseFulfillmentStatus): string {
  if (status === 'fulfilled') return 'Выдано';
  if (status === 'not_fulfilled') return 'Не выдано';
  return 'Не обработано';
}

export function getFulfillmentStatusColor(status: SellerPurchaseFulfillmentStatus): string {
  if (status === 'fulfilled') return '#4CAF50';
  if (status === 'not_fulfilled') return '#FF3B30';
  return '#8E8E93';
}

export function mapSellerPurchaseToOrder(
  purchase: SellerPurchase,
  getShopById: (id: number) => Shop | undefined,
  getOfferById?: (id: number) => Offer | undefined
): SellerOrder {
  const items: SellerOrderItem[] = purchase.purchase_offers.map((purchaseOffer, index) => {
    const offer = getOfferById?.(purchaseOffer.offer_id);
    const shopId = purchaseOffer.offer?.shop_id ?? offer?.shopId ?? null;
    const shop = shopId ? getShopById(shopId) : undefined;
    const productName =
      purchaseOffer.offer?.product?.name ||
      offer?.productName ||
      `Товар #${purchaseOffer.offer?.product_id ?? purchaseOffer.offer_id}`;

    return {
      id: index + 1,
      offerId: purchaseOffer.offer_id,
      productName,
      quantity: purchaseOffer.quantity,
      price: purchaseOffer.cost_at_purchase,
      shopId,
      shopName: shop?.shortName || shop?.address || (shopId ? `Точка #${shopId}` : 'Точка не указана'),
      shopAddress: shop?.address || shop?.fullName || undefined,
      fulfillmentStatus: purchaseOffer.fulfillment_status,
      fulfilledQuantity: purchaseOffer.fulfilled_quantity,
      unfulfilledReason: purchaseOffer.unfulfilled_reason,
    };
  });

  const shopIds = Array.from(
    new Set(items.map((item) => item.shopId).filter((value): value is number => value !== null))
  );
  const shopNames = Array.from(new Set(items.map((item) => item.shopName)));

  return {
    id: purchase.id,
    date: new Date(purchase.created_at),
    status: deriveOrderStatus(purchase),
    apiStatus: purchase.status,
    customerId: purchase.user_id,
    totalAmount: parseFloat(purchase.total_cost || '0'),
    items,
    shopIds,
    shopNames,
  };
}
