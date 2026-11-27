import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { BRAND_INFO } from '@/constants/menu';
import { BrandLogo } from '@/components/BrandLogo';
import { CheeseDripDivider } from '@/components/CheeseDripDivider';
import { StorygramStudio } from '@/components/StorygramStudio';

export const metadata: Metadata = {
  title: 'PERCHICK Storygram Studio | Custom Instagram Story Frames',
  description:
    'Koleksi 6 template Instagram Story Frame & Live Report eksklusif PERCHICK (1080×1920 PNG transparan & siap kustomisasi).',
};

export default function StorygramPage() {
  return (
    <div className="min-h-screen flex flex-col bg-perchick-cream text-perchick-charcoal">
      {/* Sticky Brand Header matching main website */}
      <nav
        aria-label="Navigasi Storygram Perchick"
        className="sticky top-0 z-30 bg-perchick-yellow/95 backdrop-blur-xs border-b-2 border-perchick-red-dark/15"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5">
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
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-xl bg-perchick-red text-white font-display font-bold text-xs sm:text-sm border-2 border-perchick-red-dark shadow-[0_2px_0_#7F1D1D] active:translate-y-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Halaman Order</span>
          </Link>
        </div>
      </nav>

      {/* Bold Perchick Storygram Hero Header */}
      <header className="relative w-full overflow-hidden">
        <div className="bg-perchick-yellow pt-7 pb-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto flex flex-col items-center text-center gap-3">
            <div className="relative h-16 w-16 overflow-hidden rounded-full border-[3px] border-perchick-red-dark bg-white p-1 shadow-[0_4px_0_#7F1D1D]">
              <Image
                src="/images/perchick-logo.png"
                alt="Logo PERCHICK"
                fill
                priority
                sizes="64px"
                className="object-contain"
              />
            </div>
            <BrandLogo size="md" showTagline />
          </div>
        </div>

        <CheeseDripDivider topColor="#FFC72C" bottomColor="#D91E18" />

        <div className="bg-perchick-red py-7 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto space-y-2.5">
            <h1 className="font-display font-bold text-3xl sm:text-5xl text-white drop-shadow-[0_3px_0_#7F1D1D]">
              Storygram{' '}
              <span className="text-perchick-yellow">Live Report</span> Frames
            </h1>
            <p className="font-sans text-sm sm:text-base text-perchick-cream/95 max-w-xl mx-auto font-medium">
              Koleksi 6 frame Instagram Story (9:16 • 1080×1920 px) siap pakai &amp; transparan untuk dokumentasi pesanan customer, unboxing, dan live report PERCHICK.
            </p>
          </div>
        </div>

        <CheeseDripDivider topColor="#D91E18" bottomColor="#FFFBEB" />
      </header>

      <main className="flex-1">
        <StorygramStudio />
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
              <span>{BRAND_INFO.instagram}</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
