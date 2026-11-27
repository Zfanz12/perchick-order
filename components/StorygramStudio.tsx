'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Download,
  ImagePlus,
  Layers,
  RotateCcw,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  STORY_HEIGHT,
  STORY_WIDTH,
  loadImageElement,
  renderStorygramToCanvas,
} from '@/lib/storygramCanvas';
import {
  STORYGRAM_TEMPLATES,
  getStorygramTemplateById,
  type StorygramCustomFields,
  type StorygramTemplate,
  type StorygramTemplateId,
} from '@/lib/storygramTemplates';

function triggerCanvasDownload(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

interface TemplateCardPreviewProps {
  template: StorygramTemplate;
  isSelected: boolean;
  logoImage: HTMLImageElement | null;
  fontsReady: boolean;
  onSelect: () => void;
  onDownloadTransparent: () => void;
}

function TemplateCardPreview({
  template,
  isSelected,
  logoImage,
  fontsReady,
  onSelect,
  onDownloadTransparent,
}: TemplateCardPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let active = true;
    async function renderPreview() {
      const loadedPhotos = await Promise.all(
        template.samplePhotos.map((src) => loadImageElement(src))
      );
      if (!active || !canvasRef.current) return;
      renderStorygramToCanvas(canvasRef.current, {
        templateId: template.id,
        fields: template.defaults,
        photos: loadedPhotos,
        logoImage,
        transparentWindow: false,
      });
    }
    void renderPreview();
    return () => {
      active = false;
    };
  }, [template, logoImage, fontsReady]);

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-3xl bg-white transition-all ${
        isSelected
          ? 'border-[3px] border-[#D91E18] shadow-[0_8px_0_#D91E18] ring-4 ring-[#FFC72C]/70'
          : 'border-2 border-[#1C1917] shadow-[0_6px_0_#1C1917] hover:-translate-y-1'
      }`}
    >
      {/* 9:16 Live Canvas Preview */}
      <button
        type="button"
        onClick={onSelect}
        className="relative aspect-[9/16] w-full cursor-pointer overflow-hidden bg-stone-100 text-left"
      >
        <canvas
          ref={canvasRef}
          width={STORY_WIDTH}
          height={STORY_HEIGHT}
          className="h-full w-full object-cover"
        />
        <span className="absolute left-3 top-3 rounded-full border-2 border-[#1C1917] bg-[#FFC72C] px-2.5 py-0.5 font-display text-[10px] font-bold tracking-wide text-[#1C1917] shadow-[0_2px_0_#1C1917]">
          {template.accentLabel}
        </span>
        {isSelected && (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-[#D91E18] text-white shadow">
            <Check className="h-4 w-4 stroke-[3]" />
          </span>
        )}
      </button>

      {/* Card Footer */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#EA580C]">
            {template.category}
          </p>
          <h3 className="mt-0.5 font-display text-lg font-bold text-[#1C1917]">
            {template.name}
          </h3>
          <p className="mt-1 font-sans text-xs leading-relaxed text-[#57534E]">
            {template.description}
          </p>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onSelect}
            className={`flex-1 cursor-pointer rounded-xl border-2 px-3 py-2 font-display text-xs font-bold transition ${
              isSelected
                ? 'border-[#7F1D1D] bg-[#D91E18] text-white'
                : 'border-[#1C1917] bg-[#FFC72C] text-[#1C1917] hover:bg-[#f5bc1b]'
            }`}
          >
            {isSelected ? 'Sedang Diedit' : 'Customize'}
          </button>
          <button
            type="button"
            onClick={onDownloadTransparent}
            title="Download Transparent 1080×1920 PNG Frame"
            className="inline-flex cursor-pointer items-center justify-center gap-1 rounded-xl border-2 border-[#1C1917]/20 bg-[#FFFBEB] px-3 py-2 font-sans text-xs font-bold text-[#1C1917] transition hover:border-[#D91E18] hover:text-[#D91E18]"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function StorygramStudio() {
  const [selectedId, setSelectedId] =
    useState<StorygramTemplateId>('live-report');
  const [fields, setFields] = useState<StorygramCustomFields>(
    getStorygramTemplateById('live-report').defaults
  );
  const [transparentMode, setTransparentMode] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<(string | null)[]>([
    null,
    null,
  ]);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const customizerRef = useRef<HTMLDivElement | null>(null);
  const fileInput1Ref = useRef<HTMLInputElement | null>(null);
  const fileInput2Ref = useRef<HTMLInputElement | null>(null);

  const selectedTemplate = getStorygramTemplateById(selectedId);

  useEffect(() => {
    void loadImageElement('/images/perchick-logo.png').then(setLogoImage);
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => setFontsReady(true));
    }
  }, []);

  // Re-render live customizer canvas whenever template, fields, or photos change
  useEffect(() => {
    let active = true;
    async function renderMain() {
      const slotSources =
        selectedTemplate.photoSlots === 2
          ? [
              uploadedUrls[0] ?? selectedTemplate.samplePhotos[0],
              uploadedUrls[1] ??
                selectedTemplate.samplePhotos[1] ??
                selectedTemplate.samplePhotos[0],
            ]
          : [uploadedUrls[0] ?? selectedTemplate.samplePhotos[0]];

      const loadedPhotos = transparentMode
        ? [null, null]
        : await Promise.all(slotSources.map((src) => loadImageElement(src)));

      if (!active || !previewCanvasRef.current) return;
      renderStorygramToCanvas(previewCanvasRef.current, {
        templateId: selectedTemplate.id,
        fields,
        photos: loadedPhotos,
        logoImage,
        transparentWindow: transparentMode,
      });
    }
    void renderMain();
    return () => {
      active = false;
    };
  }, [selectedTemplate, fields, uploadedUrls, transparentMode, logoImage, fontsReady]);

  const handleSelectTemplate = (tpl: StorygramTemplate, scroll = false) => {
    setSelectedId(tpl.id);
    setFields(tpl.defaults);
    if (scroll) {
      customizerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const handleUploadPhoto = (slotIndex: 0 | 1, file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTransparentMode(false);
        setUploadedUrls((prev) => {
          const next = [...prev];
          next[slotIndex] = reader.result as string;
          return next;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExportCurrent = async (forceTransparent: boolean) => {
    const offscreen = document.createElement('canvas');
    const slotSources =
      selectedTemplate.photoSlots === 2
        ? [
            uploadedUrls[0] ?? selectedTemplate.samplePhotos[0],
            uploadedUrls[1] ??
              selectedTemplate.samplePhotos[1] ??
              selectedTemplate.samplePhotos[0],
          ]
        : [uploadedUrls[0] ?? selectedTemplate.samplePhotos[0]];

    const loadedPhotos = forceTransparent
      ? [null, null]
      : await Promise.all(slotSources.map((src) => loadImageElement(src)));

    renderStorygramToCanvas(offscreen, {
      templateId: selectedTemplate.id,
      fields,
      photos: loadedPhotos,
      logoImage,
      transparentWindow: forceTransparent,
    });

    const suffix = forceTransparent ? 'transparent-frame' : 'story';
    triggerCanvasDownload(
      offscreen,
      `perchick-${selectedTemplate.id}-${suffix}-1080x1920.png`
    );
  };

  const handleQuickDownloadTransparent = (tpl: StorygramTemplate) => {
    const offscreen = document.createElement('canvas');
    renderStorygramToCanvas(offscreen, {
      templateId: tpl.id,
      fields: tpl.defaults,
      photos: [null, null],
      logoImage,
      transparentWindow: true,
    });
    triggerCanvasDownload(
      offscreen,
      `perchick-${tpl.id}-transparent-frame-1080x1920.png`
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Live Customizer Studio */}
      <section
        ref={customizerRef}
        className="rounded-3xl border-2 border-[#1C1917] bg-white p-5 shadow-[0_8px_0_#1C1917] sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C1917]/10 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#1C1917] bg-[#FFC72C] px-3 py-1 font-display text-xs font-bold text-[#1C1917]">
              <Sparkles className="h-3.5 w-3.5 text-[#D91E18]" />
              LIVE STUDIO • 1080 × 1920 HD
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-[#1C1917] sm:text-3xl">
              {selectedTemplate.name}
            </h2>
          </div>

          {/* Transparent Overlay vs Photo Mode Toggle */}
          <div className="inline-flex rounded-2xl border-2 border-[#1C1917] bg-[#FFFBEB] p-1">
            <button
              type="button"
              onClick={() => setTransparentMode(false)}
              className={`cursor-pointer rounded-xl px-3.5 py-2 font-display text-xs font-bold transition ${
                !transparentMode
                  ? 'bg-[#D91E18] text-white'
                  : 'text-[#1C1917] hover:bg-white'
              }`}
            >
              Dengan Foto
            </button>
            <button
              type="button"
              onClick={() => setTransparentMode(true)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2 font-display text-xs font-bold transition ${
                transparentMode
                  ? 'bg-[#D91E18] text-white'
                  : 'text-[#1C1917] hover:bg-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              Frame Transparan (PNG)
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
          {/* Left: 9:16 Live Preview */}
          <div className="flex flex-col items-center lg:col-span-5">
            <div
              className="relative aspect-[9/16] w-full max-w-[330px] overflow-hidden rounded-[28px] border-[3px] border-[#1C1917] shadow-[0_10px_25px_rgba(28,25,23,0.18)]"
              style={
                transparentMode
                  ? {
                      backgroundImage:
                        'linear-gradient(45deg, #e7e5e4 25%, transparent 25%), linear-gradient(-45deg, #e7e5e4 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e7e5e4 75%), linear-gradient(-45deg, transparent 75%, #e7e5e4 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                      backgroundColor: '#f5f5f4',
                    }
                  : undefined
              }
            >
              <canvas
                ref={previewCanvasRef}
                width={STORY_WIDTH}
                height={STORY_HEIGHT}
                className="h-full w-full object-contain"
              />
            </div>

            <p className="mt-3 text-center font-sans text-xs text-[#57534E]">
              {transparentMode
                ? 'Area kotak-kotak abu adalah area transparan (bolong) — tinggal tempel di atas foto/video IG Story atau Canva!'
                : 'Preview persis ukuran asli Instagram Story 1080 × 1920 px.'}
            </p>
          </div>

          {/* Right: Controls */}
          <div className="space-y-5 lg:col-span-7">
            {/* Template Switcher Pills */}
            <div>
              <p className="mb-2 font-sans text-xs font-extrabold uppercase tracking-wider text-[#57534E]">
                Pilih Template
              </p>
              <div className="flex flex-wrap gap-2">
                {STORYGRAM_TEMPLATES.map((tpl) => {
                  const active = tpl.id === selectedId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleSelectTemplate(tpl, false)}
                      className={`cursor-pointer rounded-xl border-2 px-3 py-2 font-display text-xs font-bold transition ${
                        active
                          ? 'border-[#7F1D1D] bg-[#D91E18] text-white shadow-[0_2px_0_#7F1D1D]'
                          : 'border-[#1C1917]/20 bg-[#FFFBEB] text-[#1C1917] hover:border-[#1C1917]'
                      }`}
                    >
                      {tpl.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Photo Upload Controls */}
            <div className="rounded-2xl border-2 border-[#1C1917]/15 bg-[#FFFBEB]/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="font-display text-sm font-bold text-[#1C1917]">
                  Foto Customer / Produk ({selectedTemplate.photoSlots} slot)
                </p>
                {(uploadedUrls[0] || uploadedUrls[1]) && (
                  <button
                    type="button"
                    onClick={() => setUploadedUrls([null, null])}
                    className="inline-flex cursor-pointer items-center gap-1 text-xs font-bold text-[#D91E18] hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Reset Foto
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <input
                    ref={fileInput1Ref}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => handleUploadPhoto(0, e.target.files?.[0])}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInput1Ref.current?.click()}
                    className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1C1917]/30 bg-white px-3 py-2 font-sans text-xs font-bold text-[#1C1917] transition hover:border-[#D91E18] hover:text-[#D91E18]"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span>
                      {uploadedUrls[0] ? 'Ganti Foto 1' : 'Upload Foto 1'}
                    </span>
                  </button>
                </div>

                {selectedTemplate.photoSlots === 2 && (
                  <div>
                    <input
                      ref={fileInput2Ref}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) =>
                        handleUploadPhoto(1, e.target.files?.[0])
                      }
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInput2Ref.current?.click()}
                      className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#1C1917]/30 bg-white px-3 py-2 font-sans text-xs font-bold text-[#1C1917] transition hover:border-[#D91E18] hover:text-[#D91E18]"
                    >
                      <ImagePlus className="h-4 w-4" />
                      <span>
                        {uploadedUrls[1] ? 'Ganti Foto 2' : 'Upload Foto 2'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Text Customization Fields */}
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <div>
                <label className="mb-1 block font-sans text-xs font-bold text-[#1C1917]">
                  Badge / Event Label
                </label>
                <input
                  type="text"
                  value={fields.badgeText}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      badgeText: e.target.value,
                    }))
                  }
                  className="min-h-[44px] w-full rounded-xl border-2 border-[#1C1917]/20 bg-white px-3.5 py-2 font-sans text-sm text-[#1C1917] outline-none focus:border-[#D91E18]"
                />
              </div>

              <div>
                <label className="mb-1 block font-sans text-xs font-bold text-[#1C1917]">
                  Tanggal / Batch / Lokasi
                </label>
                <input
                  type="text"
                  value={fields.dateLabel}
                  onChange={(e) =>
                    setFields((prev) => ({
                      ...prev,
                      dateLabel: e.target.value,
                    }))
                  }
                  className="min-h-[44px] w-full rounded-xl border-2 border-[#1C1917]/20 bg-white px-3.5 py-2 font-sans text-sm text-[#1C1917] outline-none focus:border-[#D91E18]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-sans text-xs font-bold text-[#1C1917]">
                  Judul / Headline
                </label>
                <input
                  type="text"
                  value={fields.headline}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, headline: e.target.value }))
                  }
                  className="min-h-[44px] w-full rounded-xl border-2 border-[#1C1917]/20 bg-white px-3.5 py-2 font-sans text-sm text-[#1C1917] outline-none focus:border-[#D91E18]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block font-sans text-xs font-bold text-[#1C1917]">
                  Caption / Review Customer
                </label>
                <input
                  type="text"
                  value={fields.caption}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, caption: e.target.value }))
                  }
                  className="min-h-[44px] w-full rounded-xl border-2 border-[#1C1917]/20 bg-white px-3.5 py-2 font-sans text-sm text-[#1C1917] outline-none focus:border-[#D91E18]"
                />
              </div>

              <div>
                <label className="mb-1 block font-sans text-xs font-bold text-[#1C1917]">
                  Instagram Handle / Mention
                </label>
                <input
                  type="text"
                  value={fields.handle}
                  onChange={(e) =>
                    setFields((prev) => ({ ...prev, handle: e.target.value }))
                  }
                  className="min-h-[44px] w-full rounded-xl border-2 border-[#1C1917]/20 bg-white px-3.5 py-2 font-sans text-sm text-[#1C1917] outline-none focus:border-[#D91E18]"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setFields(selectedTemplate.defaults)}
                  className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-[#1C1917]/20 bg-white px-3.5 py-2 font-sans text-xs font-bold text-[#57534E] transition hover:border-[#1C1917] hover:text-[#1C1917]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset Teks Default
                </button>
              </div>
            </div>

            {/* Export Action Buttons */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleExportCurrent(false)}
                className="btn-street flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#D91E18] px-5 py-3 font-display text-sm font-bold text-white shadow-[0_4px_0_#7F1D1D] transition hover:bg-[#B91C1C]"
              >
                <Download className="h-4 w-4" />
                <span>Download Story (1080×1920)</span>
              </button>

              <button
                type="button"
                onClick={() => void handleExportCurrent(true)}
                className="flex min-h-[52px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-[#1C1917] bg-[#FFC72C] px-5 py-3 font-display text-sm font-bold text-[#1C1917] shadow-[0_4px_0_#1C1917] transition hover:bg-[#f5bc1b]"
              >
                <Layers className="h-4 w-4" />
                <span>Download Frame Transparan</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Complete 6-Template Collection Gallery */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-block rounded-full border-2 border-[#1C1917] bg-[#FFC72C] px-4 py-1 font-display text-xs font-bold tracking-wide text-[#1C1917] shadow-[0_2px_0_#1C1917]">
            6 COHESIVE STORYGRAM FRAMES
          </span>
          <h2 className="mt-3 font-display text-3xl font-bold text-[#1C1917] sm:text-4xl">
            PERCHICK Storygram Collection
          </h2>
          <p className="mt-1.5 font-sans text-sm text-[#57534E]">
            Klik template mana saja untuk kustomisasi teks &amp; foto, atau langsung unduh file PNG transparan 1080×1920 untuk di-overlay ke Instagram Stories.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STORYGRAM_TEMPLATES.map((tpl) => (
            <TemplateCardPreview
              key={tpl.id}
              template={tpl}
              isSelected={tpl.id === selectedId}
              logoImage={logoImage}
              fontsReady={fontsReady}
              onSelect={() => handleSelectTemplate(tpl, true)}
              onDownloadTransparent={() => handleQuickDownloadTransparent(tpl)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
