'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';
import { BRAND_INFO } from '@/constants/menu';
import { BrandLogo } from '@/components/BrandLogo';
import { CheeseDripDivider } from '@/components/CheeseDripDivider';

export function HeroSection({ onOrderNow }: { onOrderNow?: () => void }) {
  const handleOrderNow = () => {
    onOrderNow?.();
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <header className="relative w-full overflow-hidden">
      {/* Golden Cheese Top Canvas inspired by the Perchick street-food poster */}
      <div className="bg-perchick-yellow pt-6 pb-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center gap-3">
          <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-full border-[3px] border-perchick-red-dark bg-white p-1 shadow-[0_4px_0_#7F1D1D]">
            <Image
              src="/images/perchick-logo.png"
              alt="Logo PERCHICK"
              fill
              priority
              sizes="80px"
              className="object-contain"
            />
          </div>
          <BrandLogo size="lg" showTagline />
        </div>
      </div>

      {/* Melted Cheese Drip Transition */}
      <CheeseDripDivider topColor="#FFC72C" bottomColor="#D91E18" />

      {/* Crimson Street-Food Hero Stage */}
      <div className="bg-perchick-red pt-4 pb-10 sm:pt-6 sm:pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Copy & Primary CTA */}
          <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left space-y-5">
            <h1 className="font-display font-bold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.06] text-white drop-shadow-[0_3px_0_#7F1D1D]">
              Cravin&apos; something{' '}
              <span className="text-perchick-yellow">Tasty?</span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-perchick-cream/95 max-w-xl font-medium leading-relaxed">
              Freshly made, crispy, cheesy. Your favorite chicken is just one
              order away!
            </p>

            <div className="pt-1 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <motion.button
                type="button"
                onClick={handleOrderNow}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96, y: 2 }}
                className="btn-street btn-street-yellow w-full sm:w-auto min-h-[54px] px-8 py-3.5 text-lg tracking-wide"
              >
                <span>ORDER NOW</span>
                <ArrowDown className="w-5 h-5 stroke-[2.5]" />
              </motion.button>
            </div>
          </div>

          {/* Right Column: Hero Product Card + Floating "Mulai 15k" Sticker */}
          <div className="lg:col-span-6 relative max-w-lg mx-auto w-full">
            {/* Floating Circular Price Sticker */}
            <motion.div
              initial={{ scale: 0.9, rotate: 8 }}
              animate={{ scale: 1, rotate: 12 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
              className="absolute -top-4 -right-2 sm:-top-5 sm:-right-4 z-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-perchick-orange text-white border-4 border-white shadow-[0_6px_0_#7F1D1D] flex flex-col items-center justify-center select-none"
            >
              <span className="text-[11px] sm:text-xs font-display font-semibold leading-none tracking-wide">
                Mulai
              </span>
              <span className="text-2xl sm:text-3xl font-display font-bold leading-none mt-0.5">
                15k
              </span>
            </motion.div>

            {/* Bold Street-Food Photo Frame */}
            <div className="relative rounded-3xl bg-white p-2.5 sm:p-3 border-4 border-perchick-cream shadow-[0_12px_0_#7F1D1D] rotate-1 lg:rotate-[1.5deg] hover:rotate-0 transition-transform duration-300">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-perchick-cream">
                <Image
                  src={BRAND_INFO.heroImage}
                  alt="PERCHICK crispy chicken bites, mac and cheese, and fries with melted cheese sauce"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              <div className="-mt-4 relative z-10 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-perchick-yellow text-perchick-charcoal font-display font-bold text-xs sm:text-sm px-4 py-1.5 border-2 border-perchick-red-dark shadow-[0_3px_0_#7F1D1D]">
                  Macaroni • Fries • Crispy Chicken Bites
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Transition to Warm Cream Menu Canvas */}
      <CheeseDripDivider topColor="#D91E18" bottomColor="#FFFBEB" />
    </header>
  );
}
