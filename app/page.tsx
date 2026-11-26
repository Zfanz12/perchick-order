'use client';

import Image from 'next/image';
import { ArrowDown, MessageCircle } from 'lucide-react';
import { BRAND_INFO } from '@/constants/menu';
import { useOrderStore } from '@/store/useOrderStore';
import { HeroSection } from '@/components/HeroSection';
import { DirectOrderForm } from '@/components/DirectOrderForm';
import { BrandLogo } from '@/components/BrandLogo';
import { CheeseDripDivider } from '@/components/CheeseDripDivider';
import { SuccessStep } from '@/components/steps/SuccessStep';

export default function HomePage() {
  const hasHydrated = useOrderStore((state) => state._hasHydrated);
  const lastSubmittedOrder = useOrderStore((state) => state.lastSubmittedOrder);

  const showSuccess = hasHydrated && Boolean(lastSubmittedOrder);

  return (
    <div className="min-h-screen flex flex-col bg-perchick-cream text-perchick-charcoal">
      {/* Compact Sticky Brand Bar */}
      <nav
        aria-label="Navigasi Perchick"
        className="sticky top-0 z-30 bg-perchick-yellow/95 backdrop-blur-xs border-b-2 border-perchick-red-dark/15"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-perchick-red-dark bg-white p-0.5 shadow-xs">
              <Image
                src="/images/perchick-logo.png"
                alt="Logo PERCHICK"
                fill
                sizes="36px"
                className="object-contain"
              />
            </div>
            <span className="font-display font-bold text-lg sm:text-xl text-perchick-red tracking-tight">
              {BRAND_INFO.name}
            </span>
          </div>

          {!showSuccess && (
            <a
              href="#menu-section"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-xl bg-perchick-red text-white font-display font-bold text-xs sm:text-sm border-2 border-perchick-red-dark shadow-[0_2px_0_#7F1D1D] active:translate-y-0.5"
            >
              <span>Pesan Sekarang</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </nav>

      <main className="flex-1">
        {showSuccess ? (
          <SuccessStep />
        ) : (
          <>
            <HeroSection />
            <DirectOrderForm />
          </>
        )}
      </main>

      <CheeseDripDivider topColor="#FFFBEB" bottomColor="#D91E18" />

      {/* Brand Footer */}
      <footer className="bg-perchick-red text-white pt-6 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <div className="flex items-center gap-3 rounded-2xl bg-perchick-yellow px-4 py-2 border-2 border-perchick-red-dark shadow-[0_4px_0_#7F1D1D]">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-perchick-red-dark bg-white p-0.5">
                <Image
                  src="/images/perchick-logo.png"
                  alt="Logo PERCHICK"
                  fill
                  sizes="40px"
                  className="object-contain"
                />
              </div>
              <BrandLogo size="sm" />
            </div>
            <p className="font-sans text-sm text-perchick-cream/95 font-medium mt-1">
              {BRAND_INFO.tagline}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={`https://wa.me/${BRAND_INFO.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-white text-perchick-charcoal px-4 py-2 font-sans font-bold text-sm border-2 border-perchick-red-dark shadow-[0_3px_0_#7F1D1D] hover:bg-perchick-yellow transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>{BRAND_INFO.whatsappDisplay}</span>
            </a>

            <a
              href={BRAND_INFO.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 min-h-[44px] rounded-xl bg-perchick-red-dark text-white px-4 py-2 font-sans font-bold text-sm border border-perchick-yellow/40 hover:bg-perchick-charcoal transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-perchick-yellow"
                aria-hidden="true"
              >
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
              </svg>
              <span>{BRAND_INFO.instagram}</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
