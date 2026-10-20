import React, { useState } from 'react';
import { MapPin, Phone, Clock, Navigation, Copy, Check, ShoppingBag } from 'lucide-react';
import type { BranchLocation, Product } from '../types';
import { formatUzs } from '../utils/format';

interface LocationsViewProps {
  locations: BranchLocation[];
  products: Product[];
  onAddToCart: (productId: string, quantity: number) => void;
}

export const LocationsView: React.FC<LocationsViewProps> = ({
  locations,
  products,
  onAddToCart,
}) => {
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || 'loc-lola');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeBranch = locations.find((l) => l.id === selectedLocId) || locations[0];
  const branchProducts = products.filter((p) => p.branchId === activeBranch?.id);
  const totalBranchStock = branchProducts.reduce((sum, p) => sum + p.stock, 0);

  const handleCopyLocation = (loc: BranchLocation) => {
    const text = `${loc.name}\nManzil: ${loc.address} (${loc.landmark})\nTel: ${loc.phone}\nGPS: ${loc.coordinates.lat}, ${loc.coordinates.lng}\nGoogle Maps: https://maps.google.com/?q=${loc.coordinates.lat},${loc.coordinates.lng}`;
    navigator.clipboard.writeText(text);
    setCopiedId(loc.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            Namangan viloyati bo‘ylab rasmiy savdo va shinomontaj filiallari
          </p>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Nam Avtoshina Filiallari va Lokatsiyalar
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Telegram botda <span className="font-mono text-slate-900">/lokatsiya</span> buyrug‘i bosilganda
            xaridorga har bir filialning aniq GPS lokatsiyasi, mo‘ljali va telefon raqami yuboriladi.
          </p>
        </div>

        <div className="text-left md:text-right shrink-0">
          <span className="block text-xs text-slate-500">Faol filiallar soni:</span>
          <span className="text-2xl font-mono font-bold text-slate-900 tabular-nums">
            {locations.length} ta markaz
          </span>
        </div>
      </div>

      {/* Main Split: Branch List Left + Interactive Map & Branch Stock Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 4 Branch Selector Cards */}
        <div className="lg:col-span-5 space-y-4">
          {locations.map((loc, idx) => {
            const isSelected = loc.id === activeBranch?.id;
            const locStock = products
              .filter((p) => p.branchId === loc.id)
              .reduce((acc, p) => acc + p.stock, 0);

            return (
              <div
                key={loc.id}
                onClick={() => setSelectedLocId(loc.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') setSelectedLocId(loc.id);
                }}
                className={`p-5 rounded-2xl border transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-white border-[#EA580C] shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-500 font-mono">
                      0{idx + 1}. {loc.district} · Filial qoldig‘i: {locStock} dona
                    </p>
                    <h3 className="text-base font-display font-bold text-slate-900 mt-1">
                      {loc.name}
                    </h3>
                  </div>
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap shrink-0 ${
                      isSelected ? 'bg-[#EA580C] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isSelected ? 'Tanlangan' : 'Ko‘rish'}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-slate-800">{loc.address}</strong> — {loc.landmark}
                    </span>
                  </p>
                  <p className="flex items-center gap-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-800">{loc.phone}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-sans text-slate-600">Mas’ul: {loc.managerName}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{loc.workingHours}</span>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    GPS: {loc.coordinates.lat.toFixed(4)}, {loc.coordinates.lng.toFixed(4)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLocation(loc);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    {copiedId === loc.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Manzil nusxalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Lokatsiyani nusxalash</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Branch Interactive Map & Available Stock Table */}
        {activeBranch && (
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {/* Visual Interactive Schematic Map of Namangan with Pins */}
            <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div>
                  <p className="text-xs text-slate-400 font-mono">
                     TANLANGAN FILIAL LOKATSIYASI · GPS {activeBranch.coordinates.lat}, {activeBranch.coordinates.lng}
                  </p>
                  <h2 className="text-xl font-display font-bold mt-1">{activeBranch.name}</h2>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeBranch.address} · Mo‘ljal: {activeBranch.landmark}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyLocation(activeBranch)}
                  className="px-4 py-2.5 bg-[#EA580C] hover:bg-[#C2410C] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{copiedId === activeBranch.id ? 'Nusxalandi!' : 'GPS linkni olish'}</span>
                </button>
              </div>

              {/* Interactive SVG Coordinate Map Representation */}
              <div className="mt-5 bg-slate-800/90 border border-slate-700 rounded-xl p-4">
                <svg
                  viewBox="0 0 600 200"
                  className="w-full h-44 rounded-lg bg-[#0F172A]"
                  role="img"
                  aria-label="Namangan filiallar xaritasi"
                >
                  {/* Subtle Road Grid */}
                  <line x1="0" y1="50" x2="600" y2="50" stroke="#1E293B" strokeWidth="1" />
                  <line x1="0" y1="100" x2="600" y2="100" stroke="#1E293B" strokeWidth="1" />
                  <line x1="0" y1="150" x2="600" y2="150" stroke="#1E293B" strokeWidth="1" />
                  <line x1="150" y1="0" x2="150" y2="200" stroke="#1E293B" strokeWidth="1" />
                  <line x1="300" y1="0" x2="300" y2="200" stroke="#1E293B" strokeWidth="1" />
                  <line x1="450" y1="0" x2="450" y2="200" stroke="#1E293B" strokeWidth="1" />

                  {/* Main Arterial Roads */}
                  <path
                    d="M 40 140 Q 220 110 360 95 T 560 55"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="4"
                  />
                  <path
                    d="M 240 20 L 360 180"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="3"
                  />

                  {/* Plot 4 Branches */}
                  {[
                    { id: 'loc-chust', x: 110, y: 132, short: 'Chust Filiali' },
                    { id: 'loc-lola', x: 265, y: 112, short: 'Lola Bosh Markazi' },
                    { id: 'loc-sardoba', x: 375, y: 92, short: 'Sardoba Filiali' },
                    { id: 'loc-gromov', x: 485, y: 64, short: 'Gromov Servis' },
                  ].map((pin) => {
                    const active = pin.id === activeBranch.id;
                    return (
                      <g
                        key={pin.id}
                        onClick={() => setSelectedLocId(pin.id)}
                        className="cursor-pointer"
                      >
                        {active && (
                          <circle
                            cx={pin.x}
                            cy={pin.y}
                            r="18"
                            fill="#EA580C"
                            fillOpacity="0.25"
                          />
                        )}
                        <circle
                          cx={pin.x}
                          cy={pin.y}
                          r={active ? '8' : '6'}
                          fill={active ? '#EA580C' : '#94A3B8'}
                          stroke="#0F172A"
                          strokeWidth="2"
                        />
                        <text
                          x={pin.x}
                          y={pin.y - 14}
                          textAnchor="middle"
                          fill={active ? '#FFFFFF' : '#CBD5E1'}
                          fontSize="11"
                          fontWeight={active ? '700' : '500'}
                        >
                          {pin.short}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="text-slate-400">Filial xizmatlari:</span>
                {activeBranch.services.map((srv, idx) => (
                  <React.Fragment key={srv}>
                    {idx > 0 && <span aria-hidden="true">·</span>}
                    <span>{srv}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Available Stock at This Branch */}
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-base font-display font-bold text-slate-900">
                    Ushbu filial omborida mavjud shina va diskalar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Jami filialdagi qoldiq: <strong className="font-mono text-slate-900">{totalBranchStock} dona</strong>
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {branchProducts.map((p) => (
                  <div key={p.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500 font-mono">
                        {p.size} · {p.category} · Mos: {p.compatibleCars.join(', ')}
                      </p>
                      <h4 className="text-sm font-display font-semibold text-slate-900 mt-0.5">
                        {p.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right font-mono tabular-nums">
                        <span className="block text-sm font-semibold text-slate-900">
                          {formatUzs(p.salePrice)}
                        </span>
                        <span className="block text-xs text-emerald-700">
                          Qoldiq: {p.stock} dona
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={p.stock <= 0}
                        onClick={() => onAddToCart(p.id, 4)}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white text-xs font-medium rounded-lg inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>+ 4 ta</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
