'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { makeOrderItemId } from '@/constants/menu';
import type {
  CustomerDetails,
  DeliveryScheduleId,
  DirectOrderStoreState,
  OrderItem,
  PackageId,
  PaymentProof,
  SauceId,
  SideOptionId,
  SubmittedOrder,
} from '@/types/order';

const INITIAL_CUSTOMER: CustomerDetails = {
  fullName: '',
  whatsapp: '',
  fulfillmentMethod: 'DELIVERY',
  mapPin: null,
  address: '',
  notes: '',
};

export const useOrderStore = create<DirectOrderStoreState>()(
  persist(
    (set) => ({
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      orderItems: [],
      deliveryScheduleId: 'MINGGU_29_NOV',
      customer: INITIAL_CUSTOMER,
      paymentProof: null,
      lastSubmittedOrder: null,

      addOrderItem: (
        packageId: PackageId,
        sides: SideOptionId[],
        sauceId: SauceId,
        addMushroom: boolean,
        quantity: number
      ) =>
        set((state) => {
          const safeQty = Math.max(1, Math.min(99, Math.floor(quantity)));
          const resolvedSides: SideOptionId[] =
            packageId === 'TRIPLE' ? ['MACARONI', 'FRIES'] : sides.slice(0, 1);
          const id = makeOrderItemId(
            packageId,
            resolvedSides,
            sauceId,
            addMushroom
          );
          const existing = state.orderItems.find((item) => item.id === id);

          if (existing) {
            return {
              orderItems: state.orderItems.map((item) =>
                item.id === id
                  ? { ...item, quantity: Math.min(99, item.quantity + safeQty) }
                  : item
              ),
            };
          }

          const nextItem: OrderItem = {
            id,
            packageId,
            sides: resolvedSides,
            sauceId,
            addMushroom,
            quantity: safeQty,
          };

          return {
            orderItems: [...state.orderItems, nextItem],
          };
        }),

      updateOrderItemQuantity: (itemId: string, quantity: number) =>
        set((state) => {
          const safeQty = Math.floor(quantity);
          if (safeQty <= 0) {
            return {
              orderItems: state.orderItems.filter((item) => item.id !== itemId),
            };
          }
          return {
            orderItems: state.orderItems.map((item) =>
              item.id === itemId
                ? { ...item, quantity: Math.min(99, safeQty) }
                : item
            ),
          };
        }),

      removeOrderItem: (itemId: string) =>
        set((state) => ({
          orderItems: state.orderItems.filter((item) => item.id !== itemId),
        })),

      clearOrderItems: () => set({ orderItems: [] }),

      setDeliveryScheduleId: (deliveryScheduleId: DeliveryScheduleId) =>
        set({ deliveryScheduleId }),

      updateCustomer: (patch: Partial<CustomerDetails>) =>
        set((state) => ({
          customer: { ...state.customer, ...patch },
        })),

      setPaymentProof: (paymentProof: PaymentProof | null) =>
        set({ paymentProof }),

      completeOrderSubmission: (submittedOrder: SubmittedOrder) =>
        set({
          lastSubmittedOrder: submittedOrder,
          orderItems: [],
          paymentProof: null,
        }),

      startNewOrder: () =>
        set({
          orderItems: [],
          paymentProof: null,
          lastSubmittedOrder: null,
        }),
    }),
    {
      name: 'perchick-direct-order-b3-v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      partialize: (state) => ({
        orderItems: state.orderItems,
        deliveryScheduleId: state.deliveryScheduleId,
        customer: state.customer,
        paymentProof: state.paymentProof,
        lastSubmittedOrder: state.lastSubmittedOrder,
      }),
    }
  )
);
