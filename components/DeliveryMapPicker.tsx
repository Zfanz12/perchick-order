'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import type { MapPinLocation } from '@/types/order';

const DropPinMapInner = dynamic(
  () => import('@/components/DropPinMapInner').then((mod) => mod.DropPinMapInner),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[280px] w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#1C1917]/20 bg-white text-xs font-semibold text-[#57534E] sm:h-[320px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#D91E18]" />
        <span>Memuat peta interaktif...</span>
      </div>
    ),
  }
);

interface DeliveryMapPickerProps {
  value: MapPinLocation | null | undefined;
  onChange: (pin: MapPinLocation) => void;
}

export function DeliveryMapPicker({ value, onChange }: DeliveryMapPickerProps) {
  return <DropPinMapInner value={value} onChange={onChange} />;
}
