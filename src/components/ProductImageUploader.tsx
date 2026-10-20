import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Link,
  Trash2,
  Camera,
  Sparkles,
  Check,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import type { Product, ProductCategory } from '../types';
import { getProductImage } from '../utils/format';

interface ProductImageUploaderProps {
  imageUrl?: string;
  imageType?: Product['imageType'];
  category?: ProductCategory;
  productName?: string;
  onChange: (data: { imageUrl: string; imageType: Product['imageType'] }) => void;
}

// Compress and convert image file to high-quality lightweight Data URL
export const compressImageFile = (
  file: File,
  maxDimension = 800,
  quality = 0.84
): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Faqat rasm fayllari qabul qilinadi (.jpg, .png, .webp)'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Draw image onto canvas with high smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Rasmni yuklab bo‘lmadi'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Faylni o‘qishda xatolik'));
    reader.readAsDataURL(file);
  });
};

const PRESET_OPTIONS: Array<{
  id: Product['imageType'];
  label: string;
  category: string;
}> = [
  { id: 'summer', label: 'Yozgi Shina (Sport)', category: 'Shina' },
  { id: 'winter', label: 'Qishki Shina (Qor/Muz)', category: 'Shina' },
  { id: 'allSeason', label: '4 Fasl Shina (All-Season)', category: 'Shina' },
  { id: 'wheel', label: 'Litye Diska (Sport)', category: 'Diska' },
  { id: 'battery', label: 'Akkumulyator (Delkor/Varta)', category: 'Akkumulyator' },
  { id: 'accessory', label: 'Aksessuarlar (Asboblar)', category: 'Aksessuarlar' },
];

export const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  imageUrl = '',
  imageType = 'summer',
  category,
  productName = '',
  onChange,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [urlInput, setUrlInput] = useState(imageUrl.startsWith('http') ? imageUrl : '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasCustomImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  // Compute preview URL
  const previewSrc = hasCustomImage ? imageUrl : getProductImage(imageType);

  const handleFileChange = async (file: File) => {
    setIsProcessing(true);
    setUploadError(null);
    try {
      const dataUrl = await compressImageFile(file, 800, 0.84);
      onChange({ imageUrl: dataUrl, imageType });
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Rasm yuklashda xatolik yuz berdi');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileChange(file);
    }
    // reset input value so re-selecting same file triggers change
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileChange(file);
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setUploadError('Iltimos, haqiqiy rasm havolasini kiriting');
      return;
    }
    setUploadError(null);
    onChange({ imageUrl: trimmed, imageType });
  };

  const handleSelectPreset = (presetType: Product['imageType']) => {
    setUploadError(null);
    onChange({ imageUrl: '', imageType: presetType });
  };

  const handleClearImage = () => {
    setUrlInput('');
    setUploadError(null);
    onChange({ imageUrl: '', imageType });
  };

  return (
    <div className="space-y-3.5 bg-[#0D121F] border border-slate-800 rounded-2xl p-4">
      {/* Header with Title and Status */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <label className="text-xs font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-orange-400" />
          <span>Mahsulot Rasmi:</span>
        </label>
        {hasCustomImage ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 text-[11px] font-semibold border border-emerald-500/40">
            <Check className="w-3 h-3" />
            <span>Yangi rasm biriktirilgan</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-mono border border-slate-700">
            Standart shablon
          </span>
        )}
      </div>

      {/* Main Image Display & Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
        {/* Left: Live Image Preview Box */}
        <div className="sm:col-span-5 relative group">
          <div className="w-full aspect-[4/3] rounded-2xl bg-[#080C14] border-2 border-slate-700/80 overflow-hidden relative shadow-lg">
            <img
              src={previewSrc}
              alt={productName || 'Mahsulot rasmi'}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
            />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-white text-xs">
                <RefreshCw className="w-5 h-5 text-orange-400 animate-spin" />
                <span>Rasm qayta ishlanmoqda...</span>
              </div>
            )}
          </div>

          {/* Clear button if custom image exists */}
          {hasCustomImage && (
            <button
              type="button"
              onClick={handleClearImage}
              className="mt-2 w-full py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 hover:text-red-200 text-[11px] font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Biriktirilgan rasmni tozalash"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Maxsus rasmni o‘chirish (Standartga qaytish)</span>
            </button>
          )}
        </div>

        {/* Right: Method selector (File Upload, URL, Presets) */}
        <div className="sm:col-span-7 space-y-3">
          {/* Method Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#111726] border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Qurilmadan</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>Havola (URL)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-orange-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Galereya</span>
            </button>
          </div>

          {/* TAB 1: File Upload */}
          {activeTab === 'upload' && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-orange-500 bg-orange-500/10'
                  : 'border-slate-700 hover:border-orange-500/70 bg-[#111726]/60 hover:bg-[#111726]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 mx-auto mb-2">
                <Camera className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">
                Rasm tanlash uchun bu yerga bosing
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                yoki rasmni shu yerga sudrab tashlang (JPG, PNG, WEBP)
              </p>
            </div>
          )}

          {/* TAB 2: Image URL input */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="block text-[11px] text-slate-300">
                Internetdagi rasm havolasini kiriting (https://...):
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/michelin-tire.jpg"
                  className="flex-1 px-3 py-2 bg-[#111726] border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shrink-0"
                >
                  Qo‘llash
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Istalgan saytdagi shina, diska yoki akkumulyator rasm havolasini qo‘yishingiz mumkin.
              </p>
            </div>
          )}

          {/* TAB 3: Preset Options */}
          {activeTab === 'presets' && (
            <div className="space-y-1.5">
              <label className="block text-[11px] text-slate-300">
                Tayyor professional fotosuratlar:
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pr-1">
                {PRESET_OPTIONS.map((opt) => {
                  const isSelected = !hasCustomImage && imageType === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectPreset(opt.id)}
                      className={`p-2 rounded-xl text-left border text-[11px] transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E293B] border-orange-500 text-white font-bold shadow-xs'
                          : 'bg-[#111726] border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-orange-400 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {uploadError && (
            <div className="p-2.5 bg-red-950/60 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
