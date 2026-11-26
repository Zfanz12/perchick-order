/*
 * ============================================================================
 * PERCHICK – Perfectly Chicken (Pre-Order Batch 3)
 * Supabase Turnkey SQL Schema DDL
 * ============================================================================
 * create table if not exists public.perchick_orders (
 *   id uuid primary key default gen_random_uuid(),
 *   order_id text unique not null,
 *   batch text not null default 'BATCH_3',
 *   status text not null default 'WAITING_PAYMENT_VERIFICATION',
 *   status_label text not null default 'Waiting for Payment Verification',
 *   items jsonb not null,
 *   customer_name text not null,
 *   customer_whatsapp text not null,
 *   fulfillment_method text not null,
 *   delivery_location text,
 *   customer_address text,
 *   customer_notes text,
 *   delivery_schedule_id text not null,
 *   delivery_schedule_label text not null,
 *   pricing jsonb not null,
 *   payment_method text not null default 'QRIS GoPay Merchant',
 *   payment_proof jsonb not null,
 *   created_at timestamptz not null default now()
 * );
 * ============================================================================
 */

import {
  BRAND_INFO,
  MUSHROOM_ADDON_PRICE,
  calculateItemsPricing,
  formatRupiah,
  formatSidesLabel,
  getPackageById,
  getSauceById,
  getScheduleById,
} from '@/constants/menu';
import type {
  OrderSubmissionPayload,
  SubmittedOrder,
  SubmittedOrderItem,
} from '@/types/order';

const SUBMITTED_ORDERS_STORAGE_KEY = 'perchick_submitted_orders_b3_v3';
const MAX_STORED_ORDERS = 15;
const MIN_SUBMISSION_UX_DELAY_MS = 650;
const ORDER_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStoredOrders(): SubmittedOrder[] {
  if (!isBrowser()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(SUBMITTED_ORDERS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SubmittedOrder[]) : [];
  } catch {
    return [];
  }
}

function saveOrderToLocalStorage(order: SubmittedOrder): void {
  if (!isBrowser()) {
    return;
  }

  const existing = readStoredOrders().filter((item) => item.orderId !== order.orderId);
  const nextOrders = [order, ...existing].slice(0, MAX_STORED_ORDERS);

  try {
    window.localStorage.setItem(SUBMITTED_ORDERS_STORAGE_KEY, JSON.stringify(nextOrders));
  } catch {
    for (let cap = nextOrders.length; cap >= 1; cap -= 1) {
      const trimmed = nextOrders.slice(0, cap).map((entry, index) =>
        index === 0
          ? entry
          : {
              ...entry,
              paymentProof: {
                ...entry.paymentProof,
                previewDataUrl: '',
              },
            }
      );

      try {
        window.localStorage.setItem(SUBMITTED_ORDERS_STORAGE_KEY, JSON.stringify(trimmed));
        return;
      } catch {
        // Keep reducing until storage fits
      }
    }

    try {
      const compactNewest: SubmittedOrder = {
        ...order,
        paymentProof: {
          ...order.paymentProof,
          previewDataUrl: '',
        },
      };
      window.localStorage.setItem(
        SUBMITTED_ORDERS_STORAGE_KEY,
        JSON.stringify([compactNewest])
      );
    } catch {
      // Do not block order completion if storage is completely unavailable
    }
  }
}

function getRandomCodeSuffix(length: number): string {
  const chars: string[] = [];

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    for (let i = 0; i < length; i += 1) {
      chars.push(ORDER_ID_ALPHABET[bytes[i] % ORDER_ID_ALPHABET.length]);
    }
    return chars.join('');
  }

  for (let i = 0; i < length; i += 1) {
    const idx = Math.floor(Math.random() * ORDER_ID_ALPHABET.length);
    chars.push(ORDER_ID_ALPHABET[idx]);
  }
  return chars.join('');
}

async function ensureMinimumDelay(startedAt: number, minDelayMs: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const remaining = minDelayMs - elapsed;
  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, remaining);
    });
  }
}

export function generateOrderId(): string {
  const existingIds = new Set(readStoredOrders().map((order) => order.orderId));

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = `PCK-B3-${getRandomCodeSuffix(4)}`;
    if (!existingIds.has(candidate)) {
      return candidate;
    }
  }

  const fallbackSuffix = Date.now()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(-4)
    .padStart(4, 'X');
  return `PCK-B3-${fallbackSuffix}`;
}

export async function submitOrder(
  payload: OrderSubmissionPayload
): Promise<SubmittedOrder> {
  const startedAt = Date.now();

  if (!payload.items || payload.items.length === 0) {
    throw new Error('Pilih minimal 1 paket pesanan terlebih dahulu.');
  }

  if (!payload.paymentProof || !payload.paymentProof.previewDataUrl) {
    throw new Error('Bukti pembayaran QRIS wajib diunggah sebelum konfirmasi pesanan.');
  }

  const fullName = payload.customer?.fullName?.trim() ?? '';
  const whatsapp = payload.customer?.whatsapp?.trim() ?? '';
  const fulfillmentMethod = payload.customer?.fulfillmentMethod ?? 'DELIVERY';
  const mapPin = payload.customer?.mapPin ?? null;
  const address = payload.customer?.address?.trim() ?? '';
  const notes = payload.customer?.notes?.trim() ?? '';

  if (!fullName || !whatsapp) {
    throw new Error('Nama lengkap dan nomor WhatsApp aktif wajib diisi.');
  }

  if (fulfillmentMethod === 'DELIVERY' && !mapPin) {
    throw new Error('Drop pin lokasi di peta wajib dipilih untuk metode Delivery.');
  }

  if (fulfillmentMethod === 'DELIVERY' && !address) {
    throw new Error('Alamat pengantaran wajib diisi untuk metode Delivery.');
  }

  const submittedItems: SubmittedOrderItem[] = payload.items.map((item) => {
    const pkg = getPackageById(item.packageId);
    const sauce = getSauceById(item.sauceId);
    const qty = Math.max(1, Math.floor(item.quantity));
    const unitBasePrice = pkg.basePrice;
    const unitAddonPrice = item.addMushroom ? MUSHROOM_ADDON_PRICE : 0;
    const sidesLabel =
      item.packageId === 'TRIPLE'
        ? 'Macaroni + Fries'
        : formatSidesLabel(item.sides);

    return {
      id: item.id,
      packageId: pkg.id,
      packageName: pkg.name,
      sidesLabel,
      sauceId: sauce.id,
      sauceName: sauce.name,
      addMushroom: item.addMushroom,
      quantity: qty,
      unitBasePrice,
      unitAddonPrice,
      lineTotal: (unitBasePrice + unitAddonPrice) * qty,
    };
  });

  const pricing = calculateItemsPricing(payload.items);
  const deliverySchedule = getScheduleById(payload.deliveryScheduleId);
  const orderId = generateOrderId();
  const createdAt = new Date().toISOString();

  const baseOrder: Omit<SubmittedOrder, 'storageDriver'> = {
    orderId,
    batch: 'BATCH_3',
    status: 'WAITING_PAYMENT_VERIFICATION',
    statusLabel: 'Waiting for Payment Verification',
    createdAt,
    items: submittedItems,
    customer: {
      fullName,
      whatsapp,
      fulfillmentMethod,
      ...(fulfillmentMethod === 'DELIVERY' && mapPin ? { mapPin } : {}),
      ...(fulfillmentMethod === 'DELIVERY' && address ? { address } : {}),
      ...(notes ? { notes } : {}),
    },
    deliverySchedule,
    pricing,
    paymentMethod: 'QRIS GoPay Merchant',
    paymentProof: payload.paymentProof,
  };

  let storageDriver: SubmittedOrder['storageDriver'] = 'localStorage';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (supabaseUrl && supabaseAnonKey) {
    const endpoint = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/perchick_orders`;
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          order_id: baseOrder.orderId,
          batch: baseOrder.batch,
          status: baseOrder.status,
          status_label: baseOrder.statusLabel,
          items: baseOrder.items,
          customer_name: baseOrder.customer.fullName,
          customer_whatsapp: baseOrder.customer.whatsapp,
          fulfillment_method: baseOrder.customer.fulfillmentMethod,
          customer_map_pin: baseOrder.customer.mapPin ?? null,
          customer_address: baseOrder.customer.address ?? null,
          customer_notes: baseOrder.customer.notes ?? null,
          delivery_schedule_id: baseOrder.deliverySchedule.id,
          delivery_schedule_label: baseOrder.deliverySchedule.dayLabel,
          pricing: baseOrder.pricing,
          payment_method: baseOrder.paymentMethod,
          payment_proof: baseOrder.paymentProof,
          created_at: baseOrder.createdAt,
        }),
      });

      if (response.ok) {
        storageDriver = 'supabase';
      }
    } catch {
      // Gracefully fall back to localStorage below
    }
  }

  const submittedOrder: SubmittedOrder = {
    ...baseOrder,
    storageDriver,
  };

  if (storageDriver === 'localStorage') {
    saveOrderToLocalStorage(submittedOrder);
  }

  await ensureMinimumDelay(startedAt, MIN_SUBMISSION_UX_DELAY_MS);

  return submittedOrder;
}

export function buildWhatsAppOrderUrl(order: SubmittedOrder): string {
  const itemLines = order.items
    .map((item, idx) => {
      const mushroomText = item.addMushroom ? ' + Mushroom' : '';
      return `${idx + 1}. ${item.quantity}x ${item.packageName} (${item.sidesLabel} • ${item.sauceName}${mushroomText}) — ${formatRupiah(item.lineTotal)}`;
    })
    .join('\n');

  const methodLabel =
    order.customer.fulfillmentMethod === 'PICKUP'
      ? 'Pickup (Ambil Sendiri)'
      : 'Delivery (Diantar)';

  const lines: string[] = [
    `Halo Admin ${BRAND_INFO.name}!`,
    `Saya sudah melakukan pemesanan *PRE-ORDER BATCH 3* melalui website. Berikut detail pesanan saya:`,
    '',
    `*Order ID:* ${order.orderId}`,
    `*Status:* ${order.statusLabel}`,
    '',
    `*Pesanan:*`,
    itemLines,
    '',
    `*Jadwal:* ${order.deliverySchedule.dayLabel}`,
    `*Metode:* ${methodLabel}`,
    '',
    `*Data Pemesan:*`,
    `• Nama: ${order.customer.fullName}`,
    `• No. WhatsApp: ${order.customer.whatsapp}`,
  ];

  if (order.customer.fulfillmentMethod === 'DELIVERY') {
    if (order.customer.mapPin) {
      lines.push(`• Titik Peta: ${order.customer.mapPin.label}`);
      lines.push(`• Google Maps: ${order.customer.mapPin.googleMapsUrl}`);
    }
    if (order.customer.address) {
      lines.push(`• Alamat Lengkap: ${order.customer.address}`);
    }
  }

  if (order.customer.notes?.trim()) {
    lines.push(`• Catatan: ${order.customer.notes.trim()}`);
  }

  lines.push(
    '',
    `*Rincian Pembayaran:*`,
    `• Subtotal Paket: ${formatRupiah(order.pricing.subtotalPackages)}`
  );

  if (order.pricing.totalMushroom > 0) {
    lines.push(`• Add-on Mushroom: ${formatRupiah(order.pricing.totalMushroom)}`);
  }

  lines.push(
    `• *Total Pembayaran: ${formatRupiah(order.pricing.grandTotal)}*`,
    '',
    `Bukti pembayaran *QRIS GoPay Merchant* sudah saya unggah di website. Mohon dibantu verifikasi ya, Admin. Terima kasih!`
  );

  return `https://wa.me/${BRAND_INFO.whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`;
}
