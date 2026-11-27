export type StorygramTemplateId =
  | 'minimalist'
  | 'live-report'
  | 'editorial'
  | 'collage'
  | 'event-coverage'
  | 'premium';

export interface StorygramCustomFields {
  badgeText: string;
  headline: string;
  caption: string;
  dateLabel: string;
  handle: string;
}

export interface StorygramTemplate {
  id: StorygramTemplateId;
  name: string;
  category: string;
  description: string;
  photoSlots: 1 | 2;
  accentLabel: string;
  samplePhotos: string[];
  defaults: StorygramCustomFields;
}

export const STORYGRAM_TEMPLATES: StorygramTemplate[] = [
  {
    id: 'minimalist',
    name: 'Minimalist Story Frame',
    category: 'Clean & Versatile',
    description:
      'Clean warm-cream border with Perchick rooster badge, spacious 9:16 photo/video window, and crisp @perchickin footer.',
    photoSlots: 1,
    accentLabel: 'BEST FOR DAILY STORIES',
    samplePhotos: ['/images/menu-double-mac.jpg'],
    defaults: {
      badgeText: 'PERFECTLY CHICKEN',
      headline: 'FRESH OUT THE BOX',
      caption: 'Crispy chicken + creamy cheese sauce, no skips.',
      dateLabel: 'TODAY',
      handle: '@perchickin',
    },
  },
  {
    id: 'live-report',
    name: 'Live Report Frame',
    category: 'Cheese Drip Signature',
    description:
      'Iconic poster-inspired melted golden cheese drip over bold crimson red with LIVE REPORT indicator and spacious center window.',
    photoSlots: 1,
    accentLabel: 'SIGNATURE PERCHICK',
    samplePhotos: ['/images/hero-perchick.jpg'],
    defaults: {
      badgeText: 'LIVE REPORT',
      headline: "CRAVIN' SOMETHING TASTY?",
      caption: 'Order delivered & ready to feast!',
      dateLabel: 'PRE-ORDER DROP',
      handle: '@perchickin',
    },
  },
  {
    id: 'editorial',
    name: 'Editorial Story Frame',
    category: 'Bold Magazine Style',
    description:
      'Street-food magazine masthead with oversized 3D PERCHICK header, structured review strip, and official brand contact bar.',
    photoSlots: 1,
    accentLabel: 'FOOD REVIEW & UNBOXING',
    samplePhotos: ['/images/menu-triple.jpg'],
    defaults: {
      badgeText: 'TASTE TEST EDITION',
      headline: 'PAKET TRIPLE CHECK',
      caption: 'Macaroni + Fries + Crispy Chicken Slice in one box.',
      dateLabel: 'ISSUE 03',
      handle: '@perchickin',
    },
  },
  {
    id: 'collage',
    name: 'Photo Collage Frame',
    category: 'Dual-Shot Layout',
    description:
      'Two stacked rounded frames designed for unboxing + close-up sauce shots, accented with playful Perchick sticker badges.',
    photoSlots: 2,
    accentLabel: '2 PHOTO SLOTS',
    samplePhotos: ['/images/menu-double.jpg', '/images/menu-double-mac.jpg'],
    defaults: {
      badgeText: 'DOUBLE THE CRUNCH',
      headline: 'FRIES OR MACARONI?',
      caption: 'Why pick one when both hit different.',
      dateLabel: 'PERCHICK DROP',
      handle: '@perchickin',
    },
  },
  {
    id: 'event-coverage',
    name: 'Event Coverage Frame',
    category: 'Live Documentation',
    description:
      'Viewfinder corner brackets, live timestamp bar, and bold crimson/gold event banner for launches, pop-ups, and celebrations.',
    photoSlots: 1,
    accentLabel: 'EVENT & POP-UP',
    samplePhotos: ['/images/menu-single.jpg'],
    defaults: {
      badgeText: 'ON THE SPOT • REC',
      headline: 'PERCHICK LIVE MOMENT',
      caption: 'Serving hot crispy chicken all evening!',
      dateLabel: 'BANDUNG • LIVE',
      handle: '@perchickin',
    },
  },
  {
    id: 'premium',
    name: 'Premium Storygram Frame',
    category: 'Collector Brand Edition',
    description:
      'Full website-matched yellow PERCHICK lockup emblem, deep crimson frame with subtle cheese drips, and gold-rimmed media window.',
    photoSlots: 1,
    accentLabel: 'PREMIUM EDITION',
    samplePhotos: ['/images/hero-perchick.jpg'],
    defaults: {
      badgeText: 'CUSTOMER SPOTLIGHT',
      headline: 'RASAKAN PERCHICKAN NIKMATNYA',
      caption: 'Thank you for ordering with PERCHICK!',
      dateLabel: 'VERIFIED ORDER',
      handle: '@perchickin',
    },
  },
];

export function getStorygramTemplateById(
  id: StorygramTemplateId
): StorygramTemplate {
  return (
    STORYGRAM_TEMPLATES.find((tpl) => tpl.id === id) ?? STORYGRAM_TEMPLATES[0]
  );
}
