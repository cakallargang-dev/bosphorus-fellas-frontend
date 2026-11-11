/**
 * Arac markalari — tek kaynak.
 * Logolar public/brands/<slug>.svg altinda gercek marka logolaridir.
 */

export interface CarBrand {
  slug: string;
  label: string;
  /** Eski serbest metin degerleriyle eslesme icin anahtar kelimeler */
  keys: string[];
}

export const CAR_BRANDS: CarBrand[] = [
  { slug: "bmw", label: "BMW", keys: ["bmw"] },
  { slug: "audi", label: "Audi", keys: ["audi"] },
  { slug: "mercedes", label: "Mercedes-Benz", keys: ["mercedes", "benz"] },
  { slug: "volkswagen", label: "Volkswagen", keys: ["volkswagen", "vw"] },
  { slug: "porsche", label: "Porsche", keys: ["porsche"] },
  { slug: "tesla", label: "Tesla", keys: ["tesla"] },
  { slug: "ford", label: "Ford", keys: ["ford"] },
  { slug: "renault", label: "Renault", keys: ["renault"] },
  { slug: "fiat", label: "Fiat", keys: ["fiat"] },
  { slug: "toyota", label: "Toyota", keys: ["toyota"] },
  { slug: "honda", label: "Honda", keys: ["honda"] },
  { slug: "hyundai", label: "Hyundai", keys: ["hyundai"] },
  { slug: "seat", label: "SEAT", keys: ["seat"] },
  { slug: "skoda", label: "Škoda", keys: ["skoda", "škoda"] },
  { slug: "volvo", label: "Volvo", keys: ["volvo"] },
  { slug: "mini", label: "MINI", keys: ["mini"] },
  { slug: "alfaromeo", label: "Alfa Romeo", keys: ["alfa"] },
  { slug: "peugeot", label: "Peugeot", keys: ["peugeot"] },
  { slug: "citroen", label: "Citroën", keys: ["citroen", "citroën"] },
  { slug: "kia", label: "Kia", keys: ["kia"] },
  { slug: "nissan", label: "Nissan", keys: ["nissan"] },
  { slug: "mazda", label: "Mazda", keys: ["mazda"] },
  { slug: "lexus", label: "Lexus", keys: ["lexus"] },
  { slug: "jaguar", label: "Jaguar", keys: ["jaguar"] },
  { slug: "landrover", label: "Land Rover", keys: ["land rover", "landrover", "range rover", "defender"] },
];

/** DB'de saklanan degeri (slug veya serbest metin) marka tanimina cevirir */
export function findBrand(value?: string | null): CarBrand | null {
  if (!value) return null;
  const v = value.toLowerCase().trim();

  // 1) Dogrudan slug eslesmesi
  const bySlug = CAR_BRANDS.find((b) => b.slug === v);
  if (bySlug) return bySlug;

  // 2) Anahtar kelime eslesmesi (eski serbest metin kayitlari)
  return CAR_BRANDS.find((b) => b.keys.some((k) => v.includes(k))) || null;
}

/** Marka logosunun yolu */
export function brandLogo(slug: string): string {
  return `/brands/${slug}.svg`;
}

/** Serbest metinden logo yolu */
export function brandLogoOf(value?: string | null): string | null {
  const b = findBrand(value);
  return b ? brandLogo(b.slug) : null;
}
