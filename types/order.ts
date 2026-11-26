export type PackageId = 'SINGLE' | 'DOUBLE' | 'TRIPLE';

export type SideOptionId = 'MACARONI' | 'FRIES';

export type SauceId = 'Cheese' | 'Garlic' | 'Mix';

export type DeliveryScheduleId = 'MINGGU_29_NOV' | 'SENIN_30_NOV';

export type FulfillmentMethod = 'PICKUP' | 'DELIVERY';

export interface MenuPackage {
  id: PackageId;
  name: string;
  shortCode: PackageId;
  description: string;
  basePrice: number;
  image: string;
  isPopular?: boolean;
  highlightTag?: string;
  requiresSideChoice: boolean;
}

export interface SideOption {
  id: SideOptionId;
  label: string;
}

export interface SauceOption {
  id: SauceId;
  name: string;
}

export interface DeliveryScheduleOption {
  id: DeliveryScheduleId;
  dayLabel: string;
}

export interface OrderItem {
  id: string; // `${packageId}-${sideKey}-${sauceId}-${addMushroom ? 'mushroom' : 'plain'}`
  packageId: PackageId;
  sides: SideOptionId[]; // ['MACARONI'] or ['FRIES'] for Single/Double, ['MACARONI', 'FRIES'] for Triple
  sauceId: SauceId;
  addMushroom: boolean;
  quantity: number;
}

export interface MapPinLocation {
  label: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
}

export interface CustomerDetails {
  fullName: string;
  whatsapp: string;
  fulfillmentMethod: FulfillmentMethod | null;
  mapPin?: MapPinLocation | null;
  address?: string;
  notes?: string;
}

export interface PaymentProof {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  previewDataUrl: string;
  uploadedAt: string;
}

export interface PriceBreakdown {
  totalItems: number;
  subtotalPackages: number;
  totalMixSauce: number;
  totalMushroom: number;
  grandTotal: number;
}

export type OrderStatus = 'WAITING_PAYMENT_VERIFICATION';

export interface SubmittedOrderItem {
  id: string;
  packageId: PackageId;
  packageName: string;
  sidesLabel: string; // 'Macaroni' | 'Fries' | 'Macaroni + Fries'
  sauceId: SauceId;
  sauceName: string;
  addMushroom: boolean;
  quantity: number;
  unitBasePrice: number;
  unitAddonPrice: number;
  lineTotal: number;
}

export interface OrderSubmissionPayload {
  items: OrderItem[];
  customer: CustomerDetails;
  deliveryScheduleId: DeliveryScheduleId;
  paymentProof: PaymentProof;
}

export interface SubmittedOrder {
  orderId: string; // PCK-B3-XXXX
  batch: 'BATCH_3';
  status: OrderStatus;
  statusLabel: 'Waiting for Payment Verification';
  createdAt: string;
  items: SubmittedOrderItem[];
  customer: CustomerDetails;
  deliverySchedule: DeliveryScheduleOption;
  pricing: PriceBreakdown;
  paymentMethod: 'QRIS GoPay Merchant';
  paymentProof: PaymentProof;
  storageDriver: 'supabase' | 'localStorage';
}

export interface DirectOrderStoreState {
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
  orderItems: OrderItem[];
  deliveryScheduleId: DeliveryScheduleId | null;
  customer: CustomerDetails;
  paymentProof: PaymentProof | null;
  lastSubmittedOrder: SubmittedOrder | null;

  addOrderItem: (
    packageId: PackageId,
    sides: SideOptionId[],
    sauceId: SauceId,
    addMushroom: boolean,
    quantity: number
  ) => void;
  updateOrderItemQuantity: (itemId: string, quantity: number) => void;
  removeOrderItem: (itemId: string) => void;
  clearOrderItems: () => void;

  setDeliveryScheduleId: (scheduleId: DeliveryScheduleId | null) => void;
  updateCustomer: (patch: Partial<CustomerDetails>) => void;
  setPaymentProof: (proof: PaymentProof | null) => void;
  completeOrderSubmission: (submittedOrder: SubmittedOrder) => void;
  startNewOrder: () => void;
}
