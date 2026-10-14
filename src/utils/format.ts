import heroImg from '../assets/images/hero_nam_avtoshina_1791716931127.jpg';
import summerTireImg from '../assets/images/tire_michelin_summer_1791716945945.jpg';
import winterTireImg from '../assets/images/tire_winter_snow_1791716957184.jpg';
import wheelSportImg from '../assets/images/wheel_alloy_sport_1791716969121.jpg';
import batteryDelkorImg from '../assets/images/battery_car_delkor_1791718641645.jpg';
import batteryVartaImg from '../assets/images/battery_varta_blue_1791719774716.jpg';
import tireAllSeasonImg from '../assets/images/tire_bridgestone_tread_1791719786506.jpg';
import accessoryImg from '../assets/images/car_accessories_1791903350010.jpg';
import type { Product } from '../types';

export const ASSETS = {
  hero: heroImg,
  summer: summerTireImg,
  winter: winterTireImg,
  wheel: wheelSportImg,
  battery: batteryDelkorImg,
  batteryVarta: batteryVartaImg,
  allSeason: tireAllSeasonImg,
  accessory: accessoryImg,
};

export function getProductImage(
  productOrType: Product | Product['imageType'] | string
): string {
  if (typeof productOrType === 'object' && productOrType !== null) {
    if (productOrType.category === 'Akkumulyator') {
      if (productOrType.brand === 'Varta' || productOrType.brand === 'Mutlu') {
        return ASSETS.batteryVarta;
      }
      return ASSETS.battery;
    }
    if (productOrType.category === 'Litye Diska') {
      return ASSETS.wheel;
    }
    if (productOrType.category === 'Aksessuarlar') {
      return ASSETS.accessory;
    }
    if (productOrType.category === 'Qishki shina') {
      return ASSETS.winter;
    }
    if (productOrType.category === '4 Fasl (All-Season)') {
      return ASSETS.allSeason;
    }
    return ASSETS.summer;
  }

  if (productOrType === 'battery') return ASSETS.battery;
  if (productOrType === 'wheel') return ASSETS.wheel;
  if (productOrType === 'accessory') return ASSETS.accessory;
  if (productOrType === 'winter') return ASSETS.winter;
  if (productOrType === 'hero') return ASSETS.hero;
  return ASSETS.summer;
}

export function formatUzs(amount: number): string {
  return `${Math.round(amount).toLocaleString('ru-RU')} so‘m`;
}

export function exportInventoryCsv(products: Product[]): void {
  const headers = [
    'SKU',
    'Mahsulot nomi',
    'Brend',
    'Kategoriya',
    'O‘lcham (Razmer)',
    'Jami Qo‘shildi (Kirim)',
    'Jami Sotildi (Chiqim)',
    'Hozirgi Qoldiq (Dona)',
    'Tan Narxi (UZS)',
    'Sotuv Narxi (UZS)',
    'Sotuvdan Tushum (UZS)',
    'Sof Foyda (UZS)',
  ];

  const rows = products.map((p) => [
    p.sku,
    `"${p.name.replace(/"/g, '""')}"`,
    p.brand,
    p.category,
    p.size,
    p.totalAdded,
    p.totalSold,
    p.stock,
    p.costPrice,
    p.salePrice,
    p.totalSold * p.salePrice,
    p.totalSold * (p.salePrice - p.costPrice),
  ]);

  const csvContent =
    '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `nam_avtoshina_hisobot_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
