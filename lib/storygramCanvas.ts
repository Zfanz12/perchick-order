import type {
  StorygramCustomFields,
  StorygramTemplateId,
} from '@/lib/storygramTemplates';

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;

const COLORS = {
  red: '#D91E18',
  redDark: '#7F1D1D',
  yellow: '#FFC72C',
  orange: '#EA580C',
  cream: '#FFFBEB',
  charcoal: '#1C1917',
  stone: '#57534E',
  white: '#FFFFFF',
} as const;

const DISPLAY_FONT = 'Fredoka, "Trebuchet MS", Arial, sans-serif';
const BODY_FONT = '"Plus Jakarta Sans", Arial, sans-serif';

export interface RenderStorygramOptions {
  templateId: StorygramTemplateId;
  fields: StorygramCustomFields;
  photos: (HTMLImageElement | null)[];
  logoImage: HTMLImageElement | null;
  transparentWindow: boolean;
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  ctx.save();
  roundedRectPath(ctx, x, y, w, h, radius);
  ctx.clip();

  const imgRatio = img.width / img.height;
  const boxRatio = w / h;
  let drawW = w;
  let drawH = h;
  let offsetX = x;
  let offsetY = y;

  if (imgRatio > boxRatio) {
    drawH = h;
    drawW = h * imgRatio;
    offsetX = x - (drawW - w) / 2;
  } else {
    drawW = w;
    drawH = w / imgRatio;
    offsetY = y - (drawH - h) / 2;
  }

  ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
  ctx.restore();
}

function punchMediaWindow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  photo: HTMLImageElement | null,
  transparentWindow: boolean,
  borderColor: string,
  borderWidth: number,
  shadowColor?: string
) {
  // Optional tactile hard shadow behind frame window
  if (shadowColor) {
    ctx.save();
    roundedRectPath(ctx, x, y + 14, w, h, radius);
    ctx.fillStyle = shadowColor;
    ctx.fill();
    ctx.restore();
  }

  if (transparentWindow || !photo) {
    // True alpha cutout so exported PNG overlays directly over IG Story photo/video
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.fillStyle = '#000000';
    ctx.fill();
    ctx.restore();
  } else {
    drawCoverImage(ctx, photo, x, y, w, h, radius);
  }

  // Crisp outer stroke around window
  if (borderWidth > 0) {
    ctx.save();
    roundedRectPath(ctx, x, y, w, h, radius);
    ctx.lineWidth = borderWidth;
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    ctx.restore();
  }
}

function drawCheeseDripBanner(
  ctx: CanvasRenderingContext2D,
  topHeight: number,
  dripColor: string = COLORS.yellow,
  highlightColor: string = '#EAB308'
) {
  ctx.save();
  ctx.fillStyle = dripColor;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(STORY_WIDTH, 0);
  ctx.lineTo(STORY_WIDTH, topHeight);

  // Smooth scalloped cheese drips across 1080px width
  const drips = [
    { x: 1025, depth: 72, w: 58 },
    { x: 915, depth: 112, w: 66 },
    { x: 790, depth: 62, w: 62 },
    { x: 655, depth: 128, w: 72 },
    { x: 525, depth: 74, w: 56 },
    { x: 390, depth: 118, w: 68 },
    { x: 250, depth: 68, w: 62 },
    { x: 120, depth: 110, w: 66 },
    { x: 32, depth: 56, w: 48 },
  ];

  let cursorX = STORY_WIDTH;
  for (const d of drips) {
    const rightEdge = d.x + d.w / 2;
    const leftEdge = d.x - d.w / 2;
    ctx.lineTo(Math.min(cursorX, rightEdge + 18), topHeight);
    ctx.bezierCurveTo(
      rightEdge,
      topHeight,
      rightEdge,
      topHeight + d.depth,
      d.x,
      topHeight + d.depth
    );
    ctx.bezierCurveTo(
      leftEdge,
      topHeight + d.depth,
      leftEdge,
      topHeight,
      Math.max(0, leftEdge - 18),
      topHeight
    );
    cursorX = leftEdge - 18;
  }

  ctx.lineTo(0, topHeight);
  ctx.closePath();
  ctx.fill();

  // Subtle underside drip shadow/accent line
  ctx.lineWidth = 6;
  ctx.strokeStyle = highlightColor;
  ctx.stroke();

  // Floating golden cheese droplets
  const drops = [
    { x: 915, y: topHeight + 148, r: 10 },
    { x: 655, y: topHeight + 164, r: 12 },
    { x: 390, y: topHeight + 152, r: 9 },
    { x: 120, y: topHeight + 144, r: 11 },
  ];
  ctx.fillStyle = dripColor;
  for (const drop of drops) {
    ctx.beginPath();
    ctx.arc(drop.x, drop.y, drop.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCircularLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  cx: number,
  cy: number,
  radius: number,
  borderColor: string = COLORS.redDark
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.white;
  ctx.fill();

  if (logo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius - 6, 0, Math.PI * 2);
    ctx.clip();
    const size = (radius - 6) * 1.9;
    ctx.drawImage(logo, cx - size / 2, cy - size / 2, size, size);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.lineWidth = 6;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();
}

/**
 * Draws the signature Perchick website yellow lockup badge
 * (circular rooster emblem + chunky 3D PERCHICK + PERFECTLY CHICKEN)
 */
function drawWebsiteLockupBadge(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null,
  centerX: number,
  y: number,
  scale = 1
) {
  const w = 640 * scale;
  const h = 148 * scale;
  const x = centerX - w / 2;
  const r = 34 * scale;

  ctx.save();
  // Hard maroon offset shadow matching the website footer badge
  roundedRectPath(ctx, x, y + 10 * scale, w, h, r);
  ctx.fillStyle = COLORS.redDark;
  ctx.fill();

  // Golden yellow pill body
  roundedRectPath(ctx, x, y, w, h, r);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();
  ctx.lineWidth = 5 * scale;
  ctx.strokeStyle = COLORS.redDark;
  ctx.stroke();

  // Circular rooster logo on left
  drawCircularLogo(
    ctx,
    logo,
    x + 86 * scale,
    y + h / 2,
    52 * scale,
    COLORS.redDark
  );

  // 3D chunky PERCHICK wordmark
  const textX = x + 162 * scale;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 ${72 * scale}px ${DISPLAY_FONT}`;

  ctx.fillStyle = COLORS.redDark;
  ctx.fillText('PERCHICK', textX + 5 * scale, y + 58 * scale + 5 * scale);
  ctx.fillStyle = COLORS.red;
  ctx.fillText('PERCHICK', textX, y + 58 * scale);

  // Subtitle PERFECTLY CHICKEN
  ctx.font = `800 ${24 * scale}px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.fillText('P E R F E C T L Y   C H I C K E N', textX + 2 * scale, y + 110 * scale);
  ctx.restore();
}

function drawPill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  bgColor: string,
  textColor: string,
  borderColor: string,
  fontSize = 26,
  paddingX = 34,
  paddingY = 16,
  shadowOffset = 6
) {
  ctx.save();
  ctx.font = `700 ${fontSize}px ${DISPLAY_FONT}`;
  const measured = ctx.measureText(text);
  const w = Math.min(920, measured.width + paddingX * 2);
  const h = fontSize + paddingY * 2;
  const x = cx - w / 2;
  const y = cy - h / 2;

  if (shadowOffset > 0) {
    roundedRectPath(ctx, x, y + shadowOffset, w, h, h / 2);
    ctx.fillStyle = borderColor;
    ctx.fill();
  }

  roundedRectPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = bgColor;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = borderColor;
  ctx.stroke();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy + 1, w - paddingX);
  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 2
) {
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }

  lines.forEach((line, index) => {
    ctx.fillText(line, cx, y + index * lineHeight, maxWidth);
  });
}

function drawMinimalistTemplate(
  ctx: CanvasRenderingContext2D,
  opts: RenderStorygramOptions
) {
  const { fields, photos, logoImage, transparentWindow } = opts;

  // Clean warm cream canvas
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  // Subtle top accent bar
  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(0, 0, STORY_WIDTH, 24);
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(0, 24, STORY_WIDTH, 8);

  // Header lockup (minimal clean bar)
  drawCircularLogo(ctx, logoImage, 118, 126, 46, COLORS.redDark);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 46px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.red;
  ctx.fillText('PERCHICK', 184, 112);
  ctx.font = `700 20px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.stone;
  ctx.fillText(fields.badgeText.toUpperCase(), 186, 150);

  // Date pill on top right
  drawPill(
    ctx,
    fields.dateLabel.toUpperCase(),
    890,
    126,
    COLORS.yellow,
    COLORS.charcoal,
    COLORS.charcoal,
    22,
    26,
    12,
    4
  );

  // Large spacious photo/video window (66% of height!)
  punchMediaWindow(
    ctx,
    64,
    218,
    952,
    1300,
    42,
    photos[0] ?? null,
    transparentWindow,
    COLORS.charcoal,
    6,
    'rgba(28, 25, 23, 0.14)'
  );

  // Clean caption & footer
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 44px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.charcoal;
  ctx.fillText(fields.headline, STORY_WIDTH / 2, 1605, 920);

  ctx.font = `600 28px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.stone;
  drawWrappedText(ctx, fields.caption, STORY_WIDTH / 2, 1668, 900, 38, 2);

  // Crisp bottom handle pill
  drawPill(
    ctx,
    `${fields.handle}  •  0812-1471-4735`,
    STORY_WIDTH / 2,
    1804,
    COLORS.red,
    COLORS.white,
    COLORS.redDark,
    24,
    36,
    14,
    5
  );
}

function drawLiveReportTemplate(
  ctx: CanvasRenderingContext2D,
  opts: RenderStorygramOptions
) {
  const { fields, photos, logoImage, transparentWindow } = opts;

  // Bold crimson poster background
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  // Iconic golden cheese drip banner at top
  drawCheeseDripBanner(ctx, 210, COLORS.yellow, '#EAB308');

  // Top branding inside cheese banner
  drawCircularLogo(ctx, logoImage, 128, 114, 54, COLORS.redDark);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 66px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.fillText('PERCHICK', 208 + 4, 102 + 4);
  ctx.fillStyle = COLORS.red;
  ctx.fillText('PERCHICK', 208, 102);

  ctx.font = `800 21px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.fillText('P E R F E C T L Y   C H I C K E N', 210, 152);

  // LIVE badge top right
  drawPill(
    ctx,
    `●  ${fields.badgeText.toUpperCase()}`,
    858,
    114,
    COLORS.red,
    COLORS.white,
    COLORS.redDark,
    22,
    26,
    14,
    5
  );

  // Spacious white-framed street-food window
  punchMediaWindow(
    ctx,
    66,
    360,
    948,
    1140,
    46,
    photos[0] ?? null,
    transparentWindow,
    COLORS.white,
    14,
    COLORS.redDark
  );

  // Tilted yellow date sticker on top-right corner of photo window
  ctx.save();
  ctx.translate(888, 368);
  ctx.rotate(0.08);
  drawPill(
    ctx,
    fields.dateLabel.toUpperCase(),
    0,
    0,
    COLORS.orange,
    COLORS.white,
    COLORS.white,
    22,
    28,
    14,
    0
  );
  ctx.restore();

  // Headline & caption on bottom red stage
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 48px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.fillText(fields.headline, STORY_WIDTH / 2 + 3, 1598 + 4, 940);
  ctx.fillStyle = COLORS.yellow;
  ctx.fillText(fields.headline, STORY_WIDTH / 2, 1598, 940);

  ctx.font = `600 28px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.cream;
  drawWrappedText(ctx, fields.caption, STORY_WIDTH / 2, 1666, 900, 38, 2);

  // Tilted tagline ribbon + handle
  ctx.save();
  ctx.translate(STORY_WIDTH / 2, 1802);
  ctx.rotate(-0.025);
  drawPill(
    ctx,
    `Rasakan PERCHICKan Nikmatnya  •  ${fields.handle}`,
    0,
    0,
    COLORS.yellow,
    COLORS.charcoal,
    COLORS.redDark,
    24,
    38,
    16,
    6
  );
  ctx.restore();
}

function drawEditorialTemplate(
  ctx: CanvasRenderingContext2D,
  opts: RenderStorygramOptions
) {
  const { fields, photos, logoImage, transparentWindow } = opts;

  // Warm cream editorial canvas with bold crimson outer frame
  ctx.fillStyle = COLORS.cream;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  ctx.strokeStyle = COLORS.red;
  ctx.lineWidth = 24;
  ctx.strokeRect(12, 12, STORY_WIDTH - 24, STORY_HEIGHT - 24);

  // Top editorial metadata strip
  ctx.font = `800 22px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(fields.badgeText.toUpperCase(), 70, 86);
  ctx.textAlign = 'right';
  ctx.fillText(fields.dateLabel.toUpperCase(), STORY_WIDTH - 70, 86);

  // Hairline rule
  ctx.fillStyle = COLORS.charcoal;
  ctx.fillRect(70, 114, STORY_WIDTH - 140, 4);

  // Oversized Magazine Masthead
  ctx.textAlign = 'center';
  ctx.font = `700 124px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.fillText('PERCHICK', STORY_WIDTH / 2 + 6, 206 + 6);
  ctx.fillStyle = COLORS.red;
  ctx.fillText('PERCHICK', STORY_WIDTH / 2, 206);

  ctx.fillStyle = COLORS.charcoal;
  ctx.fillRect(70, 274, STORY_WIDTH - 140, 4);

  // Spacious editorial frame
  punchMediaWindow(
    ctx,
    70,
    316,
    940,
    1160,
    28,
    photos[0] ?? null,
    transparentWindow,
    COLORS.charcoal,
    6,
    'rgba(217, 30, 24, 0.18)'
  );

  // Editorial review footer card
  roundedRectPath(ctx, 70, 1520, 940, 224, 30);
  ctx.fillStyle = COLORS.white;
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = COLORS.charcoal;
  ctx.stroke();

  drawCircularLogo(ctx, logoImage, 156, 1632, 54, COLORS.redDark);

  ctx.textAlign = 'left';
  ctx.font = `700 40px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.red;
  ctx.fillText(fields.headline, 236, 1592, 730);

  ctx.font = `600 26px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.charcoal;
  drawWrappedText(ctx, fields.caption, 236 + 365, 1656, 730, 36, 2);

  // Bottom contact strip
  ctx.textAlign = 'center';
  ctx.font = `800 24px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.fillText(
    `${fields.handle}   •   WA 0812-1471-4735   •   PERFECTLY CHICKEN`,
    STORY_WIDTH / 2,
    1822
  );
}

function drawCollageTemplate(
  ctx: CanvasRenderingContext2D,
  opts: RenderStorygramOptions
) {
  const { fields, photos, logoImage, transparentWindow } = opts;

  // Bold crimson canvas with golden bottom band
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  ctx.fillStyle = COLORS.yellow;
  ctx.fillRect(0, 1630, STORY_WIDTH, 290);

  // Top Header
  drawPill(
    ctx,
    fields.badgeText.toUpperCase(),
    STORY_WIDTH / 2,
    102,
    COLORS.yellow,
    COLORS.charcoal,
    COLORS.redDark,
    26,
    38,
    14,
    6
  );

  // Slot 1 (Top photo card)
  punchMediaWindow(
    ctx,
    74,
    184,
    932,
    645,
    38,
    photos[0] ?? null,
    transparentWindow,
    COLORS.white,
    12,
    COLORS.redDark
  );

  // Slot 2 (Bottom photo card)
  punchMediaWindow(
    ctx,
    74,
    892,
    932,
    645,
    38,
    photos[1] ?? photos[0] ?? null,
    transparentWindow,
    COLORS.white,
    12,
    COLORS.redDark
  );

  // Playful overlapping center sticker between the 2 photos
  ctx.save();
  ctx.translate(STORY_WIDTH / 2, 860);
  ctx.rotate(-0.04);
  drawPill(
    ctx,
    fields.headline,
    0,
    0,
    COLORS.orange,
    COLORS.white,
    COLORS.white,
    30,
    44,
    16,
    8
  );
  ctx.restore();

  // Bottom yellow brand bar
  drawCircularLogo(ctx, logoImage, 136, 1748, 56, COLORS.redDark);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 50px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.red;
  ctx.fillText('PERCHICK', 216, 1720);

  ctx.font = `700 24px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.charcoal;
  ctx.fillText(fields.caption, 218, 1774, 780);

  ctx.font = `800 22px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.redDark;
  ctx.fillText(`${fields.handle}  •  ${fields.dateLabel.toUpperCase()}`, 218, 1834);
}

function drawEventCoverageTemplate(
  ctx: CanvasRenderingContext2D,
  opts: RenderStorygramOptions
) {
  const { fields, photos, logoImage, transparentWindow } = opts;

  // Deep charcoal-red street camera frame
  ctx.fillStyle = COLORS.charcoal;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  // Top live-coverage bar
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(0, 0, STORY_WIDTH, 168);

  // REC dot + badge left
  ctx.beginPath();
  ctx.arc(84, 86, 14, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.yellow;
  ctx.fill();

  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = `700 30px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.white;
  ctx.fillText(fields.badgeText.toUpperCase(), 116, 86);

  // Date/Location right
  ctx.textAlign = 'right';
  ctx.font = `700 24px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.yellow;
  ctx.fillText(fields.dateLabel.toUpperCase(), STORY_WIDTH - 64, 86);

  // Spacious full-bleed framed viewfinder window
  punchMediaWindow(
    ctx,
    54,
    214,
    972,
    1290,
    32,
    photos[0] ?? null,
    transparentWindow,
    COLORS.yellow,
    5
  );

  // Camera viewfinder corner L-brackets in golden yellow
  const drawCorner = (x: number, y: number, dx: number, dy: number) => {
    ctx.save();
    ctx.strokeStyle = COLORS.yellow;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + dx * 56, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + dy * 56);
    ctx.stroke();
    ctx.restore();
  };
  drawCorner(88, 248, 1, 1);
  drawCorner(992, 248, -1, 1);
  drawCorner(88, 1470, 1, -1);
  drawCorner(992, 1470, -1, -1);

  // Bottom event headline + website lockup badge
  ctx.textAlign = 'center';
  ctx.font = `700 44px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.white;
  ctx.fillText(fields.headline, STORY_WIDTH / 2, 1574, 940);

  ctx.font = `600 26px ${BODY_FONT}`;
  ctx.fillStyle = '#D6D3D1';
  ctx.fillText(fields.caption, STORY_WIDTH / 2, 1626, 920);

  drawWebsiteLockupBadge(ctx, logoImage, STORY_WIDTH / 2, 1682, 0.88);

  ctx.font = `700 22px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.yellow;
  ctx.fillText(`${fields.handle}  •  0812-1471-4735`, STORY_WIDTH / 2, 1872);
}

function drawPremiumTemplate(
  ctx: CanvasRenderingContext2D,
  opts: RenderStorygramOptions
) {
  const { fields, photos, logoImage, transparentWindow } = opts;

  // Rich crimson brand backdrop
  ctx.fillStyle = COLORS.red;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  // Subtle decorative cheese drip at very top
  drawCheeseDripBanner(ctx, 96, COLORS.yellow, '#EAB308');

  // Signature Website Yellow Lockup Badge centered at top
  drawWebsiteLockupBadge(ctx, logoImage, STORY_WIDTH / 2, 152, 0.96);

  // Spacious gold-rimmed photo/video frame
  punchMediaWindow(
    ctx,
    68,
    356,
    944,
    1156,
    46,
    photos[0] ?? null,
    transparentWindow,
    COLORS.yellow,
    12,
    COLORS.redDark
  );

  // Overlapping pill badge at bottom edge of photo window
  drawPill(
    ctx,
    `${fields.badgeText.toUpperCase()}  •  ${fields.dateLabel.toUpperCase()}`,
    STORY_WIDTH / 2,
    1512,
    COLORS.yellow,
    COLORS.charcoal,
    COLORS.redDark,
    24,
    38,
    14,
    6
  );

  // Headline + caption + handle
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 42px ${DISPLAY_FONT}`;
  ctx.fillStyle = COLORS.white;
  ctx.fillText(fields.headline, STORY_WIDTH / 2, 1612, 940);

  ctx.font = `600 28px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.cream;
  drawWrappedText(ctx, fields.caption, STORY_WIDTH / 2, 1676, 900, 38, 2);

  // Clean bottom cream strip
  roundedRectPath(ctx, 180, 1768, 720, 74, 37);
  ctx.fillStyle = COLORS.cream;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.redDark;
  ctx.stroke();

  ctx.font = `800 26px ${BODY_FONT}`;
  ctx.fillStyle = COLORS.red;
  ctx.fillText(
    `${fields.handle}   •   0812-1471-4735`,
    STORY_WIDTH / 2,
    1806
  );
}

export function renderStorygramToCanvas(
  canvas: HTMLCanvasElement,
  opts: RenderStorygramOptions
) {
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  switch (opts.templateId) {
    case 'minimalist':
      drawMinimalistTemplate(ctx, opts);
      break;
    case 'live-report':
      drawLiveReportTemplate(ctx, opts);
      break;
    case 'editorial':
      drawEditorialTemplate(ctx, opts);
      break;
    case 'collage':
      drawCollageTemplate(ctx, opts);
      break;
    case 'event-coverage':
      drawEventCoverageTemplate(ctx, opts);
      break;
    case 'premium':
      drawPremiumTemplate(ctx, opts);
      break;
  }
}

export function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
