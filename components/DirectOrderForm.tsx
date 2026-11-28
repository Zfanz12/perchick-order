'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Flame,
  ImagePlus,
  Loader2,
  MapPin,
  Minus,
  Plus,
  QrCode,
  RefreshCw,
  Send,
  Store,
  Trash2,
  Truck,
  Upload,
} from 'lucide-react';
import {
  BRAND_INFO,
  DELIVERY_SCHEDULES,
  MENU_PACKAGES,
  MIX_SAUCE_ADDON_PRICE,
  MUSHROOM_ADDON_PRICE,
  SAUCE_OPTIONS,
  SIDE_OPTIONS,
  calculateItemsPricing,
  calculateSaucePricing,
  formatRupiah,
  formatSidesLabel,
  getPackageById,
  getSauceById,
  getScheduleById,
} from '@/constants/menu';
import { DeliveryMapPicker } from '@/components/DeliveryMapPicker';
import { submitOrder } from '@/services/orderService';
import { useOrderStore } from '@/store/useOrderStore';
import type {
  PackageId,
  PaymentProof,
  SauceId,
  SideOptionId,
} from '@/types/order';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION_PX = 1000;
const JPEG_QUALITY = 0.75;

function normalizeWhatsapp(raw: string): string {
  return raw.replace(/[\s\-().]/g, '');
}

function isValidIndonesianWhatsapp(raw: string): boolean {
  const cleaned = normalizeWhatsapp(raw);
  return /^(?:\+62|62|0)8[1-9][0-9]{7,11}$/.test(cleaned);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}

function estimateBase64Bytes(dataUrl: string): number {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return dataUrl.length;
  const base64 = dataUrl.slice(commaIndex + 1);
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

async function compressProofImage(file: File): Promise<PaymentProof> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error('Gagal membaca file gambar. Coba foto lain.'));
      image.src = objectUrl;
    });

    const scale = Math.min(
      1,
      MAX_DIMENSION_PX / Math.max(img.width || 1, img.height || 1)
    );
    const targetWidth = Math.max(1, Math.round(img.width * scale));
    const targetHeight = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Browser tidak mendukung pemrosesan gambar.');
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const previewDataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
    const sizeBytes = estimateBase64Bytes(previewDataUrl);

    return {
      fileName: file.name,
      mimeType: 'image/jpeg',
      sizeBytes,
      previewDataUrl,
      uploadedAt: new Date().toISOString(),
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

interface FieldErrors {
  fullName?: string;
  whatsapp?: string;
  deliverySchedule?: string;
  fulfillmentMethod?: string;
  mapPin?: string;
  address?: string;
  paymentProof?: string;
}

export function DirectOrderForm() {
  // Draft builder state (starts completely unselected and resets after clicking "Tambah Pesanan")
  const [draftPackageId, setDraftPackageId] = useState<PackageId | null>(null);
  const [draftSide, setDraftSide] = useState<SideOptionId | null>(null);
  const [draftSauce, setDraftSauce] = useState<SauceId | null>(null);
  const [draftMushroom, setDraftMushroom] = useState<boolean>(false);
  const [draftQty, setDraftQty] = useState<number>(1);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState<string | null>(null);

  // Persisted order state
  const orderItems = useOrderStore((state) => state.orderItems);
  const deliveryScheduleId = useOrderStore((state) => state.deliveryScheduleId);
  const customer = useOrderStore((state) => state.customer);
  const paymentProof = useOrderStore((state) => state.paymentProof);

  const addOrderItem = useOrderStore((state) => state.addOrderItem);
  const updateOrderItemQuantity = useOrderStore(
    (state) => state.updateOrderItemQuantity
  );
  const removeOrderItem = useOrderStore((state) => state.removeOrderItem);
  const setDeliveryScheduleId = useOrderStore(
    (state) => state.setDeliveryScheduleId
  );
  const updateCustomer = useOrderStore((state) => state.updateCustomer);
  const setPaymentProof = useOrderStore((state) => state.setPaymentProof);
  const completeOrderSubmission = useOrderStore(
    (state) => state.completeOrderSubmission
  );

  const carouselRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoTick, setPhotoTick] = useState(0);
  const [karboClickFade, setKarboClickFade] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhotoTick((prev) => prev + 1);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const selectedPackage = draftPackageId ? getPackageById(draftPackageId) : null;
  const isTriple = draftPackageId === 'TRIPLE';
  const draftUnitPrice = selectedPackage
    ? selectedPackage.basePrice +
      calculateSaucePricing(draftSauce, draftMushroom).totalSauceExtra
    : 0;

  const pricing = calculateItemsPricing(orderItems);
  const selectedSchedule = deliveryScheduleId
    ? getScheduleById(deliveryScheduleId)
    : null;
  const isDelivery = customer.fulfillmentMethod === 'DELIVERY';
  const isPickup = customer.fulfillmentMethod === 'PICKUP';

  const handleAddOrderItem = () => {
    setDraftError(null);
    if (!draftPackageId || !selectedPackage) {
      setDraftError('Pilih paket (Single, Double, atau Triple) terlebih dahulu.');
      return;
    }
    if (!isTriple && !draftSide) {
      setDraftError('Pilih karbo Macaroni atau Fries terlebih dahulu.');
      return;
    }
    if (!draftSauce && !draftMushroom) {
      setDraftError(
        'Pilih minimal 1 saus (Cheese, Garlic, Mix, atau Mushroom) terlebih dahulu.'
      );
      return;
    }

    const resolvedSides: SideOptionId[] = isTriple
      ? ['MACARONI', 'FRIES']
      : [draftSide as SideOptionId];
    const resolvedSauceId: SauceId = draftSauce ?? 'Mushroom';
    const resolvedAddMushroom = draftSauce ? draftMushroom : false;

    addOrderItem(
      draftPackageId,
      resolvedSides,
      resolvedSauceId,
      resolvedAddMushroom,
      draftQty
    );

    const sidesText = formatSidesLabel(resolvedSides);
    const sauceText = getSauceById(resolvedSauceId).name;
    const mushroomText = resolvedAddMushroom ? ' + Mushroom' : '';
    setAddedFeedback(
      `${draftQty}× ${selectedPackage.name} (${sidesText} • ${sauceText}${mushroomText}) ditambahkan`
    );

    // Reset all draft selections back to empty/unselected
    setDraftPackageId(null);
    setDraftSide(null);
    setDraftSauce(null);
    setDraftMushroom(false);
    setDraftQty(1);
    setKarboClickFade(false);
    setSubmitError(null);
    window.setTimeout(() => setAddedFeedback(null), 2400);
  };

  const handleCopyNominal = async () => {
    try {
      await navigator.clipboard.writeText(String(pricing.grandTotal));
      setCopiedNominal(true);
      window.setTimeout(() => setCopiedNominal(false), 2000);
    } catch {
      setCopiedNominal(false);
    }
  };

  const handleSelectedFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError(null);
    setFieldErrors((prev) => ({ ...prev, paymentProof: undefined }));

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setUploadError('Format file harus berupa JPG, PNG, atau WEBP.');
      return;
    }

    setIsCompressing(true);
    try {
      const proof = await compressProofImage(file);
      setPaymentProof(proof);
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'Gagal memproses bukti pembayaran.'
      );
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (orderItems.length === 0) {
      setSubmitError(
        'Ringkasan pesanan masih kosong. Pilih menu lalu klik "Tambah Pesanan" terlebih dahulu.'
      );
      return;
    }

    const nextErrors: FieldErrors = {};
    if (customer.fullName.trim().length < 2) {
      nextErrors.fullName = 'Nama lengkap wajib diisi (minimal 2 karakter).';
    }
    if (!isValidIndonesianWhatsapp(customer.whatsapp)) {
      nextErrors.whatsapp =
        'Masukkan nomor WhatsApp Indonesia yang valid (contoh: 081234567890).';
    }
    if (!deliveryScheduleId) {
      nextErrors.deliverySchedule = 'Pilih jadwal terlebih dahulu.';
    }
    if (!customer.fulfillmentMethod) {
      nextErrors.fulfillmentMethod =
        'Pilih metode pengambilan (Pickup atau Delivery).';
    }
    if (isDelivery && !customer.mapPin) {
      nextErrors.mapPin = 'Tap di peta untuk menentukan titik lokasi pengantaran.';
    }
    if (isDelivery && (customer.address?.trim().length ?? 0) < 8) {
      nextErrors.address =
        'Alamat lengkap wajib diisi (minimal 8 karakter, sertakan patokan).';
    }
    if (!paymentProof) {
      nextErrors.paymentProof =
        'Wajib unggah bukti transfer QRIS terlebih dahulu.';
    }

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Mohon lengkapi data yang masih ditandai merah.');
      return;
    }

    if (!paymentProof || !deliveryScheduleId) return;

    setIsSubmitting(true);
    try {
      const submitted = await submitOrder({
        items: orderItems,
        customer: {
          ...customer,
          whatsapp: normalizeWhatsapp(customer.whatsapp),
        },
        deliveryScheduleId,
        paymentProof,
      });
      completeOrderSubmission(submitted);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Terjadi kendala saat mengirim pesanan. Coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="menu-section"
      className="relative bg-perchick-cream px-4 py-10 sm:px-6 sm:py-14 lg:px-8"
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mx-auto max-w-6xl space-y-8"
      >
        {/* Section Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-bold text-[#1C1917] sm:text-4xl">
            Pilih Paketmu
          </h2>
        </div>

        {/* STEP 1: Package Cards (Mobile: swipeable horizontal carousel + stylized arrows; Desktop: 3-column grid) */}
        <div className="relative">
          <div
            ref={carouselRef}
            className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0 md:pb-0 lg:gap-6"
          >
            {MENU_PACKAGES.map((pkg) => {
              const isSelected = draftPackageId === pkg.id;
              const isPopular = Boolean(pkg.isPopular || pkg.id === 'DOUBLE');

              return (
                <motion.button
                  key={pkg.id}
                  type="button"
                  whileTap={{ scale: 0.985 }}
                  onClick={() => {
                    setKarboClickFade(false);
                    setDraftPackageId(pkg.id);
                    setDraftError(null);
                    if (pkg.id === 'TRIPLE') {
                      setDraftSide(null);
                    }
                  }}
                  className={`relative flex w-[78%] shrink-0 snap-center cursor-pointer flex-col overflow-hidden rounded-3xl bg-white text-left transition-all sm:w-[58%] md:w-auto ${isSelected
                    ? 'border-[3px] border-[#D91E18] shadow-[0_8px_0_#D91E18] ring-4 ring-[#FFC72C]/70'
                    : isPopular
                      ? 'border-2 border-[#1C1917] shadow-[0_6px_0_#1C1917] hover:-translate-y-0.5'
                      : 'border-2 border-[#1C1917]/20 shadow-[0_6px_0_rgba(28,25,23,0.12)] hover:border-[#1C1917]/50'
                    }`}
                >
                  <div className="absolute left-3.5 right-3.5 top-3 z-10 flex items-center justify-between gap-2">
                    {isPopular ? (
                      <span className="inline-flex items-center gap-1 rounded-full border-2 border-[#1C1917] bg-[#FFC72C] px-3 py-1 font-display text-xs font-bold text-[#1C1917] shadow-[0_2px_0_#1C1917]">
                        <Flame className="h-3.5 w-3.5 fill-[#D91E18] text-[#D91E18]" />
                        MOST POPULAR
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border-2 border-[#1C1917] bg-[#FFFBEB] px-3 py-1 font-display text-xs font-bold text-[#1C1917]">
                        {pkg.highlightTag}
                      </span>
                    )}

                    {isSelected && (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#D91E18] text-white shadow">
                        <Check className="h-4 w-4 stroke-[3]" />
                      </span>
                    )}
                  </div>

                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#FFFBEB]">
                    {pkg.images && pkg.images.length > 1 ? (
                      pkg.images.map((src, imgIdx) => {
                        const isCardLocked =
                          (pkg.id === 'SINGLE' || pkg.id === 'DOUBLE') &&
                          draftPackageId === pkg.id &&
                          draftSide !== null;
                        const activeIndex = isCardLocked
                          ? draftSide === 'MACARONI'
                            ? 1
                            : 0
                          : photoTick % pkg.images!.length;
                        const isCurrent = activeIndex === imgIdx;
                        const fadeDurationClass =
                          isCardLocked && karboClickFade
                            ? 'duration-500'
                            : 'duration-1000';
                        return (
                          <Image
                            key={src}
                            src={src}
                            alt={`${pkg.name} ${imgIdx + 1}`}
                            fill
                            sizes="(max-width: 768px) 80vw, 33vw"
                            className={`object-cover transition-opacity ease-in-out ${fadeDurationClass} ${isCurrent ? 'opacity-100' : 'opacity-0'
                              }`}
                          />
                        );
                      })
                    ) : (
                      <Image
                        src={pkg.image}
                        alt={pkg.name}
                        fill
                        sizes="(max-width: 768px) 80vw, 33vw"
                        className="object-cover"
                      />
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
                    <div>
                      <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight text-[#1C1917] text-left">
                        {pkg.name}
                      </h3>
                      <p className="mt-0.5 font-display text-lg sm:text-xl font-bold text-[#D91E18] text-right">
                        {formatRupiah(pkg.basePrice)}
                      </p>
                      <p className="mt-1 font-sans text-[11px] sm:text-sm text-[#57534E] text-left leading-snug">
                        {pkg.description}
                      </p>
                    </div>

                    <div className="mt-2 sm:mt-4 flex items-center justify-end border-t border-[#1C1917]/10 pt-2 sm:pt-3">
                      <span
                        className={`rounded-xl px-3 py-1 font-display text-xs font-bold ${isSelected
                          ? 'bg-[#D91E18] text-white'
                          : 'border border-[#1C1917]/15 bg-[#FFFBEB] text-[#1C1917]'
                          }`}
                      >
                        {isSelected ? 'Dipilih' : 'Pilih'}
                      </span>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Mobile Carousel Navigation Arrows */}
          <div className="mt-2 flex items-center justify-center gap-3 md:hidden">
            <button
              type="button"
              onClick={() =>
                carouselRef.current?.scrollBy({ left: -260, behavior: 'smooth' })
              }
              aria-label="Geser paket ke kiri"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#1C1917] bg-[#FFC72C] text-[#1C1917] shadow-[0_3px_0_#1C1917] transition active:translate-y-0.5"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.75]" />
            </button>
            <span className="font-display text-xs font-bold text-[#57534E]">
              Geser pilih paket
            </span>
            <button
              type="button"
              onClick={() =>
                carouselRef.current?.scrollBy({ left: 260, behavior: 'smooth' })
              }
              aria-label="Geser paket ke kanan"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-[#1C1917] bg-[#FFC72C] text-[#1C1917] shadow-[0_3px_0_#1C1917] transition active:translate-y-0.5"
            >
              <ChevronRight className="h-5 w-5 stroke-[2.75]" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Workspace (Mobile: Customize -> Ringkasan -> Data -> QRIS) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Customize Package Card (Compact, greyed out until a package is selected) */}
          <div
            aria-disabled={!draftPackageId}
            className={`order-1 space-y-3.5 rounded-3xl border-2 border-[#1C1917] bg-white p-4 shadow-[0_5px_0_#1C1917] transition-all sm:p-5 lg:col-span-7 lg:col-start-1 ${!draftPackageId
                ? 'pointer-events-none select-none opacity-45 grayscale'
                : ''
              }`}
          >
            {/* Karbo: Macaroni / Fries (both selected & static on TRIPLE) */}
            <div className="space-y-2">
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1C1917]">
                Karbo{selectedPackage ? ` (${selectedPackage.name})` : ''}
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {SIDE_OPTIONS.map((side) => {
                  const active = isTriple || draftSide === side.id;
                  return (
                    <button
                      key={side.id}
                      type="button"
                      disabled={isTriple}
                      onClick={() => {
                        if (!isTriple) {
                          setKarboClickFade(true);
                          setDraftSide(side.id);
                          setDraftError(null);
                        }
                      }}
                      className={`flex min-h-[42px] items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left transition ${isTriple
                          ? 'cursor-not-allowed border-stone-300 bg-stone-100 opacity-75'
                          : active
                            ? 'cursor-pointer border-[#D91E18] bg-[#FFFBEB] ring-2 ring-[#FFC72C]/50'
                            : 'cursor-pointer border-[#1C1917]/15 bg-white hover:border-[#1C1917]/40'
                        }`}
                    >
                      <span
                        className={`font-display text-sm sm:text-base font-bold ${isTriple ? 'text-stone-500' : 'text-[#1C1917]'
                          }`}
                      >
                        {side.label}
                      </span>
                      {active && (
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-white ${isTriple ? 'bg-stone-400' : 'bg-[#D91E18]'
                            }`}
                        >
                          <Check className="h-3 w-3 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.deliverySchedule && (
                <p className="mt-1 font-sans text-xs font-semibold text-[#D91E18]">
                  {fieldErrors.deliverySchedule}
                </p>
              )}
            </div>

            {/* Saus: Cheese / Garlic (checkboxes), Mix Saus, and Mushroom Sauce */}
            <div className="space-y-2 border-t border-[#1C1917]/10 pt-3.5">
              <h3 className="font-display text-base sm:text-lg font-bold text-[#1C1917]">
                2. Pilih Saus
              </h3>

              <div className="grid grid-cols-2 gap-2.5">
                {SAUCE_OPTIONS.map((sauce) => {
                  const active =
                    draftSauce === 'Mix' || draftSauce === sauce.id;
                  return (
                    <button
                      key={sauce.id}
                      type="button"
                      onClick={() => {
                        setDraftSauce((prev) => {
                          if (sauce.id === 'Cheese') {
                            if (prev === 'Cheese') return null;
                            if (prev === 'Garlic') return 'Mix';
                            if (prev === 'Mix') return 'Garlic';
                            return 'Cheese';
                          }
                          if (sauce.id === 'Garlic') {
                            if (prev === 'Garlic') return null;
                            if (prev === 'Cheese') return 'Mix';
                            if (prev === 'Mix') return 'Cheese';
                            return 'Garlic';
                          }
                          return prev === sauce.id ? null : sauce.id;
                        });
                        setDraftError(null);
                      }}
                      className={`flex min-h-[42px] cursor-pointer items-center justify-between gap-2 rounded-xl border-2 px-3 py-2 text-left transition ${active
                        ? 'border-[#D91E18] bg-[#FFFBEB] ring-2 ring-[#FFC72C]/50'
                        : 'border-[#1C1917]/15 bg-white hover:border-[#1C1917]/40'
                        }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${active
                            ? 'border-[#D91E18] bg-[#D91E18] text-white'
                            : 'border-[#1C1917]/35 bg-white'
                            }`}
                        >
                          {active && <Check className="h-3 w-3 stroke-[3]" />}
                        </span>
                        <span className="font-display text-sm sm:text-base font-bold text-[#1C1917]">
                          {sauce.name}
                        </span>
                      </span>
                      {draftMushroom && (
                        <span className="font-sans text-xs font-bold text-[#1C1917] shrink-0">
                          +{formatRupiah(MIX_SAUCE_ADDON_PRICE)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Mix Sauce Checkbox (+Rp3.000, or +Rp6.000 when combined with Mushroom) */}
              <button
                type="button"
                onClick={() => {
                  setDraftSauce((prev) => (prev === 'Mix' ? null : 'Mix'));
                  setDraftError(null);
                }}
                className={`flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 text-left transition ${draftSauce === 'Mix'
                  ? 'border-[#D91E18] bg-[#FFFBEB] ring-2 ring-[#FFC72C]/50'
                  : 'border-[#1C1917]/15 bg-white hover:border-[#1C1917]/40'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${draftSauce === 'Mix'
                      ? 'border-[#D91E18] bg-[#D91E18] text-white'
                      : 'border-[#1C1917]/35 bg-white'
                      }`}
                  >
                    {draftSauce === 'Mix' && (
                      <Check className="h-3 w-3 stroke-[3]" />
                    )}
                  </span>
                  <span className="font-display text-sm sm:text-base font-bold text-[#1C1917]">
                    Mix Saus (Cheese + Garlic)
                  </span>
                </span>

                <span className="font-sans text-xs sm:text-sm font-bold text-[#1C1917] shrink-0">
                  +
                  {formatRupiah(
                    draftMushroom
                      ? MIX_SAUCE_ADDON_PRICE * 2
                      : MIX_SAUCE_ADDON_PRICE
                  )}
                </span>
              </button>

              {/* Mushroom Sauce Checkbox (+Rp5.000, can be selected on its own or combined) */}
              <button
                type="button"
                onClick={() => {
                  setDraftMushroom((prev) => !prev);
                  setDraftError(null);
                }}
                className={`flex min-h-[42px] w-full cursor-pointer items-center justify-between gap-3 rounded-xl border-2 px-3 py-2 text-left transition ${draftMushroom
                  ? 'border-[#D91E18] bg-[#FFFBEB] ring-2 ring-[#FFC72C]/50'
                  : 'border-[#1C1917]/15 bg-white hover:border-[#1C1917]/40'
                  }`}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 ${draftMushroom
                      ? 'border-[#D91E18] bg-[#D91E18] text-white'
                      : 'border-[#1C1917]/35 bg-white'
                      }`}
                  >
                    {draftMushroom && <Check className="h-3 w-3 stroke-[3]" />}
                  </span>
                  <span className="font-display text-sm sm:text-base font-bold text-[#1C1917]">
                    Mushroom Sauce
                  </span>
                </span>

                <span className="font-sans text-xs sm:text-sm font-bold text-[#1C1917] shrink-0">
                  +{formatRupiah(MUSHROOM_ADDON_PRICE)}
                </span>
              </button>
            </div>

            {/* Quantity Stepper + Tambah Pesanan */}
            <div className="flex flex-col gap-2.5 border-t border-[#1C1917]/10 pt-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center justify-between gap-3 sm:justify-start">
                <div className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#1C1917] bg-[#FFFBEB] p-1">
                  <button
                    type="button"
                    onClick={() => setDraftQty((prev) => Math.max(1, prev - 1))}
                    disabled={draftQty <= 1}
                    aria-label="Kurangi jumlah"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-[#1C1917]/15 bg-white text-[#1C1917] transition hover:bg-[#FFC72C] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                  <span className="min-w-[32px] text-center font-display text-lg font-bold text-[#1C1917]">
                    {draftQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDraftQty((prev) => Math.min(99, prev + 1))}
                    aria-label="Tambah jumlah"
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#D91E18] text-white transition hover:bg-[#B91C1C]"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                  </button>
                </div>

                <span className="font-display text-base font-bold text-[#1C1917]">
                  {formatRupiah(draftUnitPrice * draftQty)}
                </span>
              </div>

              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleAddOrderItem}
                className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#1C1917] bg-[#FFC72C] px-5 py-3 font-display text-sm font-bold text-[#1C1917] shadow-[0_4px_0_#1C1917] transition hover:bg-[#f5bc1b]"
              >
                <Plus className="h-4 w-4 stroke-[3]" />
                <span>Tambah Pesanan</span>
              </motion.button>
            </div>

            {draftError && (
              <p className="rounded-xl border border-[#D91E18]/40 bg-red-50 px-3.5 py-2 font-sans text-xs font-bold text-[#D91E18]">
                {draftError}
              </p>
            )}

            {addedFeedback && (
              <p className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 font-sans text-xs font-bold text-emerald-900">
                ✓ {addedFeedback}
              </p>
            )}

            <div className="space-y-1 font-sans text-xs leading-relaxed text-[#78716C]">
              <p>
                *Jika dikombinasikan dengan Mushroom Sauce (+Rp5.000), tambahan Cheese/Garlic dikenakan +Rp3.000 per saus (total +Rp8.000 untuk 2 saus, atau +Rp11.000 untuk 3 saus).
              </p>
              <p>
                *Sudah termasuk saus sambal dan tomat terpisah (bisa request di catatan jika ingin digabung).
              </p>
            </div>
          </div>

          {/* Customer Info, Schedule, Pickup/Delivery + Notes */}
          <div className="order-3 space-y-5 rounded-3xl border-2 border-[#1C1917] bg-white p-5 shadow-[0_5px_0_#1C1917] sm:p-6 lg:col-span-7 lg:col-start-1">
            <h3 className="font-display text-xl font-bold text-[#1C1917]">
              3. Data Pemesan &amp; Pengiriman
            </h3>

            {/* Name & WhatsApp */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="direct-fullName"
                  className="mb-1.5 block font-sans text-sm font-bold text-[#1C1917]"
                >
                  Nama Lengkap <span className="text-[#D91E18]">*</span>
                </label>
                <input
                  id="direct-fullName"
                  type="text"
                  value={customer.fullName}
                  onChange={(e) => {
                    updateCustomer({ fullName: e.target.value });
                    if (fieldErrors.fullName) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        fullName: undefined,
                      }));
                    }
                  }}
                  placeholder="Contoh: Budi Santoso"
                  className={`min-h-[48px] w-full rounded-2xl border-2 bg-[#FFFBEB]/40 px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition placeholder:text-[#78716C]/70 focus:bg-white ${fieldErrors.fullName
                    ? 'border-[#D91E18] focus:ring-4 focus:ring-[#D91E18]/15'
                    : 'border-[#1C1917]/20 focus:border-[#D91E18] focus:ring-4 focus:ring-[#FFC72C]/35'
                    }`}
                />
                {fieldErrors.fullName && (
                  <p className="mt-1 font-sans text-xs font-semibold text-[#D91E18]">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="direct-whatsapp"
                  className="mb-1.5 block font-sans text-sm font-bold text-[#1C1917]"
                >
                  Nomor WhatsApp <span className="text-[#D91E18]">*</span>
                </label>
                <input
                  id="direct-whatsapp"
                  type="tel"
                  inputMode="tel"
                  value={customer.whatsapp}
                  onChange={(e) => {
                    updateCustomer({ whatsapp: e.target.value });
                    if (fieldErrors.whatsapp) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        whatsapp: undefined,
                      }));
                    }
                  }}
                  placeholder="Contoh: 081234567890"
                  className={`min-h-[48px] w-full rounded-2xl border-2 bg-[#FFFBEB]/40 px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition placeholder:text-[#78716C]/70 focus:bg-white ${fieldErrors.whatsapp
                    ? 'border-[#D91E18] focus:ring-4 focus:ring-[#D91E18]/15'
                    : 'border-[#1C1917]/20 focus:border-[#D91E18] focus:ring-4 focus:ring-[#FFC72C]/35'
                    }`}
                />
                {fieldErrors.whatsapp && (
                  <p className="mt-1 font-sans text-xs font-semibold text-[#D91E18]">
                    {fieldErrors.whatsapp}
                  </p>
                )}
              </div>
            </div>

            {/* Schedule Selection (without time) */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 font-sans text-sm font-bold text-[#1C1917]">
                <CalendarClock className="h-4 w-4 text-[#D91E18]" />
                Jadwal
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DELIVERY_SCHEDULES.map((schedule) => {
                  const active = deliveryScheduleId === schedule.id;
                  return (
                    <button
                      key={schedule.id}
                      type="button"
                      onClick={() => {
                        setDeliveryScheduleId(schedule.id);
                        if (fieldErrors.deliverySchedule) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            deliverySchedule: undefined,
                          }));
                        }
                      }}
                      className={`flex min-h-[52px] cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left transition ${active
                        ? 'border-[#D91E18] bg-[#FFFBEB] ring-4 ring-[#FFC72C]/40'
                        : 'border-[#1C1917]/15 bg-white hover:border-[#1C1917]/40'
                        }`}
                    >
                      <span className="font-display text-sm font-bold text-[#1C1917]">
                        {schedule.dayLabel}
                      </span>
                      {active && (
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D91E18] text-white">
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.deliverySchedule && (
                <p className="mt-1 font-sans text-xs font-semibold text-[#D91E18]">
                  {fieldErrors.deliverySchedule}
                </p>
              )}
            </div>

            {/* Fulfillment Method: Pickup vs Delivery */}
            <div>
              <p className="mb-2 font-sans text-sm font-bold text-[#1C1917]">
                Metode Pengambilan <span className="text-[#D91E18]">*</span>
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    updateCustomer({ fulfillmentMethod: 'PICKUP' });
                    setFieldErrors((prev) => ({
                      ...prev,
                      fulfillmentMethod: undefined,
                      mapPin: undefined,
                      address: undefined,
                    }));
                  }}
                  className={`flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-left transition ${customer.fulfillmentMethod === 'PICKUP'
                    ? 'border-[#D91E18] bg-[#FFFBEB] ring-4 ring-[#FFC72C]/40'
                    : 'border-[#1C1917]/15 bg-white hover:border-[#1C1917]/40'
                    }`}
                >
                  <Store
                    className={`h-5 w-5 shrink-0 ${customer.fulfillmentMethod === 'PICKUP'
                      ? 'text-[#D91E18]'
                      : 'text-[#78716C]'
                      }`}
                  />
                  <span className="font-display text-base font-bold text-[#1C1917]">
                    Pickup
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateCustomer({ fulfillmentMethod: 'DELIVERY' });
                    if (fieldErrors.fulfillmentMethod) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        fulfillmentMethod: undefined,
                      }));
                    }
                  }}
                  className={`flex min-h-[52px] cursor-pointer items-center gap-2.5 rounded-2xl border-2 px-4 py-3 text-left transition ${customer.fulfillmentMethod === 'DELIVERY'
                    ? 'border-[#D91E18] bg-[#FFFBEB] ring-4 ring-[#FFC72C]/40'
                    : 'border-[#1C1917]/15 bg-white hover:border-[#1C1917]/40'
                    }`}
                >
                  <Truck
                    className={`h-5 w-5 shrink-0 ${customer.fulfillmentMethod === 'DELIVERY'
                      ? 'text-[#D91E18]'
                      : 'text-[#78716C]'
                      }`}
                  />
                  <span className="font-display text-base font-bold text-[#1C1917]">
                    Delivery
                  </span>
                </button>
              </div>
              {fieldErrors.fulfillmentMethod && (
                <p className="mt-1 font-sans text-xs font-semibold text-[#D91E18]">
                  {fieldErrors.fulfillmentMethod}
                </p>
              )}
            </div>

            {/* Conditional Delivery Map + Address OR Pickup Info */}
            {isDelivery && (
              <div className="space-y-4 rounded-2xl border-2 border-[#1C1917]/10 bg-[#FFFBEB]/60 p-4">
                <div>
                  <label className="mb-1.5 flex items-center gap-1.5 font-sans text-sm font-bold text-[#1C1917]">
                    <MapPin className="h-4 w-4 text-[#D91E18]" />
                    Drop Pin Lokasi di Peta <span className="text-[#D91E18]">*</span>
                  </label>
                  <DeliveryMapPicker
                    value={customer.mapPin}
                    onChange={(pin) => {
                      updateCustomer({ mapPin: pin });
                      if (fieldErrors.mapPin) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          mapPin: undefined,
                        }));
                      }
                    }}
                  />
                  {fieldErrors.mapPin && (
                    <p className="mt-1.5 font-sans text-xs font-semibold text-[#D91E18]">
                      {fieldErrors.mapPin}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="direct-address"
                    className="mb-1.5 block font-sans text-sm font-bold text-[#1C1917]"
                  >
                    Detail Alamat Lengkap <span className="text-[#D91E18]">*</span>
                  </label>
                  <textarea
                    id="direct-address"
                    rows={3}
                    value={customer.address ?? ''}
                    onChange={(e) => {
                      updateCustomer({ address: e.target.value });
                      if (fieldErrors.address) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          address: undefined,
                        }));
                      }
                    }}
                    placeholder="Tulis alamat lengkap, nama kos/rumah, dan patokan"
                    className={`w-full rounded-2xl border-2 bg-white px-4 py-3 font-sans text-sm text-[#1C1917] outline-none transition placeholder:text-[#78716C]/70 ${fieldErrors.address
                      ? 'border-[#D91E18] focus:ring-4 focus:ring-[#D91E18]/15'
                      : 'border-[#1C1917]/20 focus:border-[#D91E18] focus:ring-4 focus:ring-[#FFC72C]/35'
                      }`}
                  />
                  {fieldErrors.address && (
                    <p className="mt-1 font-sans text-xs font-semibold text-[#D91E18]">
                      {fieldErrors.address}
                    </p>
                  )}
                </div>
              </div>
            )}

            {isPickup && (
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 text-xs leading-relaxed text-emerald-950">
                <strong>Info Pickup:</strong> Titik pengambilan akan diinfokan Admin Perchick via WhatsApp{selectedSchedule ? ` pada jadwal yang dipilih (${selectedSchedule.dayLabel})` : ''}.
              </div>
            )}

            {/* Notes (Optional) */}
            <div>
              <label
                htmlFor="direct-notes"
                className="mb-1.5 block font-sans text-sm font-bold text-[#1C1917]"
              >
                Catatan{' '}
                <span className="font-normal text-[#78716C]">(Opsional)</span>
              </label>
              <textarea
                id="direct-notes"
                rows={2}
                value={customer.notes ?? ''}
                onChange={(e) => updateCustomer({ notes: e.target.value })}
                placeholder="Contoh: Saus dipisah atau titip di pos satpam"
                className="w-full rounded-2xl border-2 border-[#1C1917]/20 bg-[#FFFBEB]/40 px-4 py-2.5 font-sans text-sm text-[#1C1917] outline-none transition placeholder:text-[#78716C]/70 focus:border-[#D91E18] focus:bg-white focus:ring-4 focus:ring-[#FFC72C]/35"
              />
            </div>
          </div>

          {/* Live Order Summary (Mobile: above Data Pemesan; Desktop: right column) */}
          <div className="order-2 rounded-3xl border-2 border-[#1C1917] bg-white p-5 shadow-[0_5px_0_#1C1917] sm:p-6 lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <div className="flex items-center justify-between border-b border-[#1C1917]/10 pb-3">
              <h3 className="font-display text-xl font-bold text-[#1C1917]">
                Ringkasan Pesanan
              </h3>
              <span className="font-sans text-xs font-bold text-[#57534E]">
                {pricing.totalItems} porsi
              </span>
            </div>

            <div className="mt-4 space-y-3 font-sans text-sm">
              {orderItems.length === 0 ? (
                <p className="py-3 text-center font-sans text-sm text-[#78716C]">
                  Belum ada pesanan
                </p>
              ) : (
                <ul className="divide-y divide-[#1C1917]/10">
                  {orderItems.map((item) => {
                    const pkg = getPackageById(item.packageId);
                    const sidesText = formatSidesLabel(item.sides);
                    const sauceLabel = getSauceById(item.sauceId).name;
                    const lineTotal =
                      (pkg.basePrice +
                        calculateSaucePricing(item.sauceId, item.addMushroom)
                          .totalSauceExtra) *
                      item.quantity;

                    return (
                      <li
                        key={item.id}
                        className="flex items-start justify-between gap-3 py-2.5 first:pt-0"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-[#1C1917]">
                            {item.quantity}× {pkg.name}
                          </p>
                          <p className="text-xs text-[#57534E]">
                            {sidesText} • {sauceLabel}
                            {item.addMushroom ? ' + Mushroom' : ''}
                          </p>

                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderItemQuantity(
                                  item.id,
                                  item.quantity - 1
                                )
                              }
                              aria-label="Kurangi item"
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#1C1917]/20 bg-[#FFFBEB] text-[#1C1917] hover:bg-[#FFC72C]"
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <span className="min-w-[18px] text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateOrderItemQuantity(
                                  item.id,
                                  item.quantity + 1
                                )
                              }
                              aria-label="Tambah item"
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-[#1C1917]/20 bg-[#FFFBEB] text-[#1C1917] hover:bg-[#FFC72C]"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeOrderItem(item.id)}
                              aria-label="Hapus item"
                              className="ml-1 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#D91E18] hover:underline"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Hapus
                            </button>
                          </div>
                        </div>

                        <span className="shrink-0 font-bold text-[#1C1917]">
                          {formatRupiah(lineTotal)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {pricing.totalMixSauce > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917]">
                  <span>Tambahan Saus (Mix)</span>
                  <span>+{formatRupiah(pricing.totalMixSauce)}</span>
                </div>
              )}

              {pricing.totalMushroom > 0 && (
                <div className="flex items-center justify-between text-xs font-semibold text-[#1C1917]">
                  <span>Saus Mushroom</span>
                  <span>+{formatRupiah(pricing.totalMushroom)}</span>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-dashed border-[#1C1917]/20 pt-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#57534E]">
                    Total Bayar
                  </p>
                  <p className="font-display text-2xl font-bold text-[#D91E18]">
                    {formatRupiah(pricing.grandTotal)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyNominal}
                  className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl border-2 border-[#1C1917]/15 bg-[#FFFBEB] px-3 py-1.5 text-xs font-bold text-[#1C1917] transition hover:border-[#D91E18]"
                >
                  {copiedNominal ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Salin Nominal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Direct QRIS + Upload Payment Proof */}
          <div className="order-4 space-y-4 rounded-3xl border-2 border-[#1C1917] bg-white p-5 shadow-[0_5px_0_#1C1917] sm:p-6 lg:col-span-5 lg:col-start-8">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-[#D91E18]" />
              <h3 className="font-display text-xl font-bold text-[#1C1917]">
                4. Pembayaran QRIS &amp; Bukti Bayar
              </h3>
            </div>

            <div className="flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_INFO.qrisImage}
                alt="QRIS PERCHICK"
                className="w-full max-w-[340px] rounded-2xl border border-[#1C1917]/15 shadow-sm"
              />
              <a
                href={BRAND_INFO.qrisImage}
                download="QRIS-PERCHICK-Batch3.jpg"
                className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-[#1C1917]/20 bg-[#FFFBEB] px-3 py-1.5 text-xs font-bold text-[#1C1917] transition hover:border-[#D91E18] hover:text-[#D91E18]"
              >
                <Download className="h-3.5 w-3.5" />
                Download QRIS
              </a>
            </div>

            {/* Upload Payment Proof */}
            <div>
              <p className="mb-2 font-sans text-sm font-bold text-[#1C1917]">
                Upload Bukti Pembayaran <span className="text-[#D91E18]">*</span>
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleSelectedFile(e.target.files?.[0])}
                className="hidden"
              />

              {!paymentProof ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleSelectedFile(e.dataTransfer.files?.[0]);
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition ${isDragging
                    ? 'border-[#D91E18] bg-[#FFFBEB]'
                    : fieldErrors.paymentProof
                      ? 'border-[#D91E18] bg-red-50/40'
                      : 'border-[#1C1917]/25 bg-[#FFFBEB]/40 hover:border-[#D91E18]'
                    }`}
                >
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <Loader2 className="h-7 w-7 animate-spin text-[#D91E18]" />
                      <p className="font-sans text-xs font-bold text-[#1C1917]">
                        Memproses gambar...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFC72C] text-[#1C1917]">
                        <ImagePlus className="h-5 w-5" />
                      </div>
                      <p className="mt-2 font-display text-sm font-bold text-[#1C1917]">
                        Tap atau tarik screenshot bukti transfer
                      </p>
                      <p className="mt-0.5 font-sans text-[11px] text-[#78716C]">
                        Format JPG, PNG, WEBP
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#D91E18] px-3.5 py-2 font-display text-xs font-bold text-white">
                        <Upload className="h-3.5 w-3.5" />
                        Pilih Foto Bukti
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/50 p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#1C1917]/15 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={paymentProof.previewDataUrl}
                        alt="Preview bukti pembayaran"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        <Check className="h-3 w-3" />
                        Siap Dikirim
                      </span>
                      <p className="mt-1 truncate font-sans text-xs font-bold text-[#1C1917]">
                        {paymentProof.fileName}
                      </p>
                      <p className="font-sans text-[11px] text-[#57534E]">
                        {formatFileSize(paymentProof.sizeBytes)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-2.5 flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#1C1917]/20 bg-white px-3 py-2 text-xs font-bold text-[#1C1917] hover:border-[#D91E18]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Ganti
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentProof(null)}
                      className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-xs font-bold text-[#D91E18] hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Hapus
                    </button>
                  </div>
                </div>
              )}

              {(uploadError || fieldErrors.paymentProof) && (
                <p className="mt-1.5 font-sans text-xs font-semibold text-[#D91E18]">
                  {uploadError || fieldErrors.paymentProof}
                </p>
              )}
            </div>

            {submitError && (
              <div className="rounded-xl border border-[#D91E18]/40 bg-red-50 px-3.5 py-2.5 font-sans text-xs font-bold text-[#D91E18]">
                {submitError}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting}
              whileTap={{ scale: 0.98 }}
              className="btn-street flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#D91E18] px-6 py-4 font-display text-base font-bold tracking-wide text-white shadow-[0_5px_0_#7F1D1D] transition hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>MENGIRIM PESANAN...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>KIRIM PESANAN SEKARANG</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </form>
    </section>
  );
}
