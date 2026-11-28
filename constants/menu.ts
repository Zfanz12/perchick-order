import type {
  DeliveryScheduleId,
  DeliveryScheduleOption,
  MenuPackage,
  OrderItem,
  PackageId,
  PriceBreakdown,
  SauceId,
  SauceOption,
  SideOption,
  SideOptionId,
} from '@/types/order';

export const BRAND_INFO = {
  name: 'PERCHICK',
  subtitle: 'Perfectly Chicken',
  tagline: 'Rasakan PERCHICKan Nikmatnya',
  batchBadge: 'PRE-ORDER BATCH 3',
  scheduleSummary: 'Minggu, 29 Nov & Senin, 30 Nov',
  whatsappNumber: '6281214714735',
  whatsappDisplay: '0812-1471-4735',
  instagram: '@perchickin',
  instagramUrl: 'https://instagram.com/perchickin',
  heroImage: '/images/hero-perchick.jpg',
  qrisImage: '/images/qris-perchick.jpg',
  qrisMerchantName: 'PERCHICK – Perfectly Chicken (GoPay Merchant)',
} as const;

export const MUSHROOM_ADDON_PRICE = 5000;
export const MIX_SAUCE_ADDON_PRICE = 3000;

export const MENU_PACKAGES: MenuPackage[] = [
  {
    id: 'SINGLE',
    shortCode: 'SINGLE',
    name: 'Paket Single',
    description: 'Mac / Fries dengan Chicken Bites',
    basePrice: 15000,
    image: '/images/menu-single.jpg',
    images: ['/images/menu-single.jpg', '/images/menu-single-mac.jpg'],
    isPopular: false,
    highlightTag: 'HEMAT 15K',
    requiresSideChoice: true,
  },
  {
    id: 'DOUBLE',
    shortCode: 'DOUBLE',
    name: 'Paket Double',
    description: 'Mac / Fries dengan Chicken Slice',
    basePrice: 22000,
    image: '/images/menu-double.jpg',
    images: ['/images/menu-double.jpg', '/images/menu-double-mac.jpg'],
    isPopular: true,
    highlightTag: 'MOST POPULAR',
    requiresSideChoice: true,
  },
  {
    id: 'TRIPLE',
    shortCode: 'TRIPLE',
    name: 'Paket Triple',
    description: 'Macaroni + Fries dengan Chicken Slice',
    basePrice: 24000,
    image: '/images/menu-triple.jpg',
    isPopular: false,
    highlightTag: 'PALING LENGKAP',
    requiresSideChoice: false,
  },
];

export const SIDE_OPTIONS: SideOption[] = [
  { id: 'MACARONI', label: 'Macaroni' },
  { id: 'FRIES', label: 'Fries' },
];

export const SAUCE_OPTIONS: SauceOption[] = [
  { id: 'Cheese', name: 'Cheese' },
  { id: 'Garlic', name: 'Garlic' },
];

export const DELIVERY_SCHEDULES: DeliveryScheduleOption[] = [
  { id: 'MINGGU_29_NOV', dayLabel: 'Minggu, 29 November' },
  { id: 'SENIN_30_NOV', dayLabel: 'Senin, 30 November' },
];

/**
 * Daftar lokasi dropdown Delivery.
 * Ubah / tambah daftar di bawah ini sesuai titik pengantaran Perchick.
 */
export const DELIVERY_LOCATIONS: string[] = [
  'Kampus / Area Utama',
  'Pogung / Sinduadi',
  'Gejayan / Karangmalang',
  'Jalan Kaliurang (Jakal)',
  'Condongcatur / Ringroad Utara',
  'Seturan / Babarsari',
  'Pusat Kota / Kotabaru',
  'Lainnya (Tulis detail di alamat)',
];

export function getPackageById(id: PackageId): MenuPackage {
  const found = MENU_PACKAGES.find((pkg) => pkg.id === id);
  if (!found) {
    throw new Error(`Unknown package id: ${id}`);
  }
  return found;
}

export function getSauceById(id: SauceId): SauceOption {
  if (id === 'Mix') {
    return { id: 'Mix', name: 'Mix (Cheese + Garlic)' };
  }
  if (id === 'Mushroom') {
    return { id: 'Mushroom', name: 'Mushroom' };
  }
  const found = SAUCE_OPTIONS.find((sauce) => sauce.id === id);
  if (!found) {
    throw new Error(`Unknown sauce id: ${id}`);
  }
  return found;
}

export function calculateSaucePricing(
  sauceId: SauceId | null,
  addMushroom: boolean
): {
  extraStandardSauceCost: number;
  mushroomCost: number;
  totalSauceExtra: number;
} {
  const hasMushroom = sauceId === 'Mushroom' || addMushroom;
  const mushroomCost = hasMushroom ? MUSHROOM_ADDON_PRICE : 0;

  let extraStandardSauceCost = 0;
  if (hasMushroom) {
    if (sauceId === 'Cheese' || sauceId === 'Garlic') {
      extraStandardSauceCost = MIX_SAUCE_ADDON_PRICE;
    } else if (sauceId === 'Mix') {
      extraStandardSauceCost = MIX_SAUCE_ADDON_PRICE * 2;
    }
  } else if (sauceId === 'Mix') {
    extraStandardSauceCost = MIX_SAUCE_ADDON_PRICE;
  }

  return {
    extraStandardSauceCost,
    mushroomCost,
    totalSauceExtra: extraStandardSauceCost + mushroomCost,
  };
}

export function getSauceExtraPrice(id: SauceId): number {
  return calculateSaucePricing(id, false).totalSauceExtra;
}

export function getScheduleById(id: DeliveryScheduleId): DeliveryScheduleOption {
  const found = DELIVERY_SCHEDULES.find((schedule) => schedule.id === id);
  if (!found) {
    throw new Error(`Unknown schedule id: ${id}`);
  }
  return found;
}

export function formatSidesLabel(sides: SideOptionId[]): string {
  const labels = sides.map((id) => {
    const found = SIDE_OPTIONS.find((s) => s.id === id);
    return found ? found.label : id;
  });
  return labels.join(' + ');
}

export function makeOrderItemId(
  packageId: PackageId,
  sides: SideOptionId[],
  sauceId: SauceId,
  addMushroom: boolean
): string {
  const normalizedSides = [...sides].sort().join('+');
  return `${packageId}-${normalizedSides}-${sauceId}-${addMushroom ? 'mushroom' : 'plain'}`;
}

export function calculateItemsPricing(items: OrderItem[]): PriceBreakdown {
  return items.reduce<PriceBreakdown>(
    (acc, item) => {
      const pkg = getPackageById(item.packageId);
      const qty = Math.max(1, Math.floor(item.quantity));
      const { extraStandardSauceCost, mushroomCost } = calculateSaucePricing(
        item.sauceId,
        item.addMushroom
      );

      acc.totalItems += qty;
      acc.subtotalPackages += pkg.basePrice * qty;
      acc.totalMixSauce += extraStandardSauceCost * qty;
      acc.totalMushroom += mushroomCost * qty;
      acc.grandTotal =
        acc.subtotalPackages + acc.totalMixSauce + acc.totalMushroom;
      return acc;
    },
    {
      totalItems: 0,
      subtotalPackages: 0,
      totalMixSauce: 0,
      totalMushroom: 0,
      grandTotal: 0,
    }
  );
}

export function formatRupiah(amount: number): string {
  const formatted = new Intl.NumberFormat('id-ID').format(Math.round(amount));
  return `Rp${formatted}`;
}
