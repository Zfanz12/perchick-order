'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  RotateCcw,
  Store,
  Truck,
  User,
} from 'lucide-react';
import { formatRupiah } from '@/constants/menu';
import { buildWhatsAppOrderUrl } from '@/services/orderService';
import { useOrderStore } from '@/store/useOrderStore';

export function SuccessStep() {
  const lastSubmittedOrder = useOrderStore((state) => state.lastSubmittedOrder);
  const startNewOrder = useOrderStore((state) => state.startNewOrder);

  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!lastSubmittedOrder) {
    return null;
  }

  async function handleCopyOrderId() {
    if (!lastSubmittedOrder) return;
    const orderId = lastSubmittedOrder.orderId;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(orderId);
      } else if (typeof document !== 'undefined') {
        const textarea = document.createElement('textarea');
        textarea.value = orderId;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch {
      // Clipboard blocked silently
    }
  }

  const whatsappUrl = buildWhatsAppOrderUrl(lastSubmittedOrder);
  const isDelivery = lastSubmittedOrder.customer.fulfillmentMethod === 'DELIVERY';

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6 sm:py-10">
      {/* Clean Celebration Hero Card */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"
        >
          <CheckCircle2 className="h-10 w-10" strokeWidth={2.2} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.25 }}
        >
          <p className="mt-4 inline-block rounded-full bg-[#D91E18] px-3.5 py-1 text-xs font-extrabold tracking-wider text-white uppercase">
            Pre-Order Diterima
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#1C1917] sm:text-4xl">
            THANK YOU FOR ORDERING!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#57534E]">
            Pesanan Perchick kamu sudah tercatat. Terima kasih sudah memesan!
          </p>
        </motion.div>

        {/* Simple Order ID Line */}
        <div className="mt-5 inline-flex flex-wrap items-center justify-center gap-2.5 rounded-xl bg-stone-50 px-4 py-2.5">
          <span className="text-xs font-semibold text-[#57534E]">
            Order ID:
          </span>
          <span className="font-display text-base font-bold tracking-wide text-[#1C1917]">
            {lastSubmittedOrder.orderId}
          </span>
          <button
            type="button"
            onClick={handleCopyOrderId}
            className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-[#57534E] border border-stone-200 transition hover:text-[#1C1917]"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Salin</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* Clean Order Summary Card (no yellow bg, no heavy border) */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-display border-b border-stone-200 pb-3 text-lg font-bold text-[#1C1917]">
          Ringkasan Pesanan
        </h3>

        <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#78716C] uppercase">
              <User className="h-3.5 w-3.5" />
              Pemesan
            </p>
            <p className="mt-1 font-bold text-[#1C1917]">
              {lastSubmittedOrder.customer.fullName}
            </p>
            <p className="text-xs font-medium text-[#57534E]">
              {lastSubmittedOrder.customer.whatsapp}
            </p>
          </div>

          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#78716C] uppercase">
              <CalendarClock className="h-3.5 w-3.5" />
              Jadwal
            </p>
            <p className="mt-1 font-bold text-[#1C1917]">
              {lastSubmittedOrder.deliverySchedule.dayLabel}
            </p>
          </div>

          <div className="sm:col-span-2 border-t border-stone-100 pt-3">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#78716C] uppercase">
              {isDelivery ? (
                <Truck className="h-3.5 w-3.5 text-[#D91E18]" />
              ) : (
                <Store className="h-3.5 w-3.5 text-[#D91E18]" />
              )}
              {isDelivery ? 'Metode Delivery' : 'Metode Pickup'}
            </p>

            {isDelivery ? (
              <div className="mt-1.5 space-y-1.5">
                {lastSubmittedOrder.customer.mapPin && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C1917]">
                      <MapPin className="h-3.5 w-3.5 text-[#D91E18]" />
                      {lastSubmittedOrder.customer.mapPin.label}
                    </span>
                    <a
                      href={lastSubmittedOrder.customer.mapPin.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#D91E18] underline"
                    >
                      Buka Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {lastSubmittedOrder.customer.address && (
                  <p className="font-medium text-[#1C1917]">
                    {lastSubmittedOrder.customer.address}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs font-medium text-[#57534E]">
                Lokasi pengambilan akan diinfokan Admin via WhatsApp.
              </p>
            )}

            {lastSubmittedOrder.customer.notes?.trim() && (
              <p className="mt-2 text-xs text-[#57534E]">
                <strong>Catatan:</strong> {lastSubmittedOrder.customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Ordered Items */}
        <ul className="mt-4 divide-y divide-stone-100 border-t border-stone-200">
          {lastSubmittedOrder.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-bold text-[#1C1917]">
                  {item.quantity}× {item.packageName}
                </p>
                <p className="text-xs text-[#57534E]">
                  {item.sidesLabel} • {item.sauceName}
                  {item.addMushroom ? ' + Mushroom' : ''}
                </p>
              </div>
              <span className="font-display font-bold text-[#1C1917]">
                {formatRupiah(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        {/* Total */}
        <div className="mt-2 flex items-center justify-between border-t border-stone-200 pt-3.5">
          <div>
            <p className="text-xs font-semibold text-[#57534E]">
              Total Pembayaran ({lastSubmittedOrder.paymentMethod})
            </p>
            <p className="text-xs text-[#78716C]">
              {lastSubmittedOrder.pricing.totalItems} porsi
            </p>
          </div>
          <span className="font-display text-xl font-bold text-[#D91E18]">
            {formatRupiah(lastSubmittedOrder.pricing.grandTotal)}
          </span>
        </div>
      </section>

      {/* Primary & Secondary CTAs */}
      <div className="flex flex-col gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display inline-flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-[#16A34A] px-6 py-3.5 text-center text-base font-bold tracking-wide text-white shadow-sm transition hover:bg-[#15803D]"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          Ada Kendala? Hubungi via WhatsApp
        </a>

        <button
          type="button"
          onClick={startNewOrder}
          className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-6 py-3 text-sm font-bold text-[#1C1917] transition hover:bg-stone-50"
        >
          <RotateCcw className="h-4 w-4" />
          Buat Pesanan Baru
        </button>
      </div>
    </div>
  );
}
