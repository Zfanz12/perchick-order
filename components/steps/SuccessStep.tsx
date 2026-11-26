'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
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
      {/* Celebration Hero Card */}
      <section className="relative overflow-hidden rounded-3xl border-2 border-[#1C1917] bg-white p-6 text-center shadow-[0_6px_0_#1C1917] sm:p-8">
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, -7, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute top-5 left-5 text-[#FFC72C]"
        >
          <Sparkles className="h-6 w-6" />
        </motion.div>
        <motion.div
          aria-hidden="true"
          animate={{ y: [0, 6, 0], rotate: [0, -10, 0] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          className="pointer-events-none absolute top-6 right-6 text-[#D91E18]/80"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.4, rotate: -10, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#1C1917] bg-[#FFC72C] shadow-[0_4px_0_#1C1917]"
        >
          <CheckCircle2 className="h-11 w-11 text-[#D91E18]" strokeWidth={2.5} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.3 }}
        >
          <p className="mt-4 inline-block rounded-full bg-[#D91E18] px-3.5 py-1 text-xs font-extrabold tracking-wider text-white uppercase">
            Pre-Order Batch 3 Diterima
          </p>
          <h2 className="font-display mt-3 text-3xl font-bold tracking-tight text-[#1C1917] sm:text-4xl">
            THANK YOU FOR ORDERING!
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#1C1917]/75">
            Pesanan Perchick kamu sudah tercatat! Simpan Order ID di bawah ini lalu klik tombol WhatsApp untuk konfirmasi ke Admin.
          </p>
        </motion.div>

        {/* Order ID Box */}
        <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-[#1C1917] bg-[#FFFBEB] p-4">
          <p className="text-xs font-bold tracking-wider text-[#1C1917]/65 uppercase">
            Order ID Kamu
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <span className="font-display text-2xl font-bold tracking-wider text-[#D91E18] sm:text-3xl">
              {lastSubmittedOrder.orderId}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderId}
              className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#1C1917] bg-white px-3.5 py-2 text-xs font-bold text-[#1C1917] shadow-[0_2px_0_#1C1917] transition hover:bg-[#FFC72C]"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-700" />
                  <span className="text-emerald-800">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  <span>Salin ID</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Status Verification Badge */}
        <div className="mx-auto mt-4 max-w-lg rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#1C1917]/20 bg-[#FFC72C] px-3 py-1 text-xs font-extrabold text-[#1C1917]">
              <Clock className="h-3.5 w-3.5" />
              {lastSubmittedOrder.statusLabel}
            </span>
          </div>
          <div className="mt-2.5 flex items-start gap-2.5 text-xs leading-relaxed text-[#1C1917]/80 sm:text-sm">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#D91E18]" />
            <p>
              Bukti pembayaran <strong>QRIS GoPay Merchant</strong> kamu akan diverifikasi secara manual oleh <strong>Admin Perchick</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* Compact Order Summary Card */}
      <section className="rounded-3xl border-2 border-[#1C1917] bg-white p-5 shadow-[0_4px_0_#1C1917] sm:p-6">
        <h3 className="font-display border-b border-[#1C1917]/10 pb-3 text-lg font-bold text-[#1C1917]">
          Ringkasan Pesanan
        </h3>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-[#FFFBEB] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]/60 uppercase">
              <User className="h-3.5 w-3.5" />
              Pemesan
            </p>
            <p className="mt-1 font-bold text-[#1C1917]">
              {lastSubmittedOrder.customer.fullName}
            </p>
            <p className="text-xs font-medium text-[#1C1917]/75">
              {lastSubmittedOrder.customer.whatsapp}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFBEB] p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]/60 uppercase">
              <CalendarClock className="h-3.5 w-3.5" />
              Jadwal Batch 3
            </p>
            <p className="mt-1 font-bold text-[#D91E18]">
              {lastSubmittedOrder.deliverySchedule.dayLabel}
            </p>
          </div>

          <div className="rounded-2xl bg-[#FFFBEB] p-3.5 sm:col-span-2">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#1C1917]/60 uppercase">
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
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#1C1917]">
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
              <p className="mt-1 text-xs font-medium text-[#1C1917]/80">
                Lokasi pengambilan akan diinfokan Admin via WhatsApp.
              </p>
            )}

            {lastSubmittedOrder.customer.notes?.trim() && (
              <p className="mt-2 rounded-xl bg-white/80 px-3 py-2 text-xs text-[#1C1917]/80 border border-[#1C1917]/10">
                <strong>Catatan:</strong> {lastSubmittedOrder.customer.notes}
              </p>
            )}
          </div>
        </div>

        {/* Ordered Items */}
        <ul className="mt-4 divide-y divide-[#1C1917]/10 rounded-2xl border border-[#1C1917]/15 bg-white px-4">
          {lastSubmittedOrder.items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-3 py-3 text-sm"
            >
              <div>
                <p className="font-bold text-[#1C1917]">
                  {item.quantity}× {item.packageName}
                </p>
                <p className="text-xs text-[#1C1917]/75">
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
        <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#1C1917]/15 bg-[#FFFBEB] px-4 py-3.5">
          <div>
            <p className="text-xs font-semibold text-[#1C1917]/75">
              Total Pembayaran ({lastSubmittedOrder.paymentMethod})
            </p>
            <p className="text-xs text-[#1C1917]/60">
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
          className="font-display inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-[#1C1917] bg-[#16A34A] px-6 py-4 text-center text-base font-bold tracking-wide text-white shadow-[0_4px_0_#1C1917] transition hover:bg-[#15803D] active:translate-y-0.5"
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          HUBUNGI ADMIN VIA WHATSAPP
        </a>

        <button
          type="button"
          onClick={startNewOrder}
          className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#1C1917] bg-white px-6 py-3 text-sm font-bold text-[#1C1917] transition hover:bg-[#FFFBEB]"
        >
          <RotateCcw className="h-4 w-4" />
          Buat Pesanan Baru
        </button>
      </div>
    </div>
  );
}
