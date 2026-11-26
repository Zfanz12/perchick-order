import { BRAND_INFO } from '@/constants/menu';

type BrandLogoSize = 'sm' | 'md' | 'lg';

const SIZE_STYLES: Record<
  BrandLogoSize,
  {
    wordmark: string;
    subtitle: string;
    ribbon: string;
    gap: string;
  }
> = {
  sm: {
    wordmark: 'text-2xl sm:text-3xl',
    subtitle: 'text-[10px] sm:text-[11px] tracking-[0.2em]',
    ribbon: 'text-xs px-3 py-1 mt-1.5',
    gap: 'gap-0.5',
  },
  md: {
    wordmark: 'text-4xl sm:text-5xl',
    subtitle: 'text-xs sm:text-sm tracking-[0.22em]',
    ribbon: 'text-xs sm:text-sm px-4 py-1.5 mt-2',
    gap: 'gap-1',
  },
  lg: {
    wordmark: 'text-5xl sm:text-6xl lg:text-7xl',
    subtitle: 'text-xs sm:text-sm tracking-[0.24em]',
    ribbon: 'text-sm sm:text-base px-5 py-1.5 mt-2.5',
    gap: 'gap-1',
  },
};

export function BrandLogo({
  size = 'md',
  showTagline = false,
}: {
  size?: BrandLogoSize;
  showTagline?: boolean;
}) {
  const styles = SIZE_STYLES[size];

  return (
    <div className={`inline-flex flex-col items-center text-center select-none ${styles.gap}`}>
      <span
        className={`font-display font-bold uppercase leading-none tracking-tight text-perchick-red ${styles.wordmark}`}
        style={{
          textShadow: '2px 3px 0 #7F1D1D, 4px 5px 0 rgba(234, 88, 12, 0.35)',
        }}
      >
        {BRAND_INFO.name}
      </span>

      <span
        className={`font-sans font-extrabold uppercase text-perchick-red-dark leading-none ${styles.subtitle}`}
      >
        {BRAND_INFO.subtitle}
      </span>

      {showTagline && (
        <span
          className={`inline-block -rotate-2 rounded-xl bg-perchick-red text-white font-display font-semibold tracking-wide shadow-[0_4px_0_#7F1D1D] border-2 border-perchick-red-dark/30 ${styles.ribbon}`}
        >
          {BRAND_INFO.tagline}
        </span>
      )}
    </div>
  );
}
