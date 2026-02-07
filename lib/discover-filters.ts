/**
 * Discover page: title and filter pill helpers.
 * URL is source of truth; type/area support comma-separated values.
 */

export type DiscoverSearchParams = {
  feed?: string;
  sort?: string;
  tab?: string;
  area?: string;
  type?: string;
  price_min?: string;
  price_max?: string;
  beds?: string;
  baths?: string;
  beds_only?: string;
  baths_only?: string;
  ewa?: string;
  [key: string]: string | undefined;
};

const HIERARCHY_KEYS = new Set([
  "feed",
  "sort",
  "tab",
  "area",
  "type",
  "price_min",
  "price_max",
  "beds",
  "baths",
  "ewa",
]);

function capitalize(s: string): string {
  if (!s) return s;
  return s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase();
}

function parseList(param: string | undefined): string[] {
  if (!param?.trim()) return [];
  return param
    .split(",")
    .map((s) => capitalize(s.trim()))
    .filter(Boolean);
}

/** Pluralize property type for title (Studios, Villas, Apartments, etc.). */
function pluralizeType(type: string): string {
  const lower = type.toLowerCase();
  if (lower === "studio") return "Studios";
  if (lower === "apartment") return "Apartments";
  if (lower === "villa") return "Villas";
  if (lower === "home") return "Homes";
  if (lower === "compound") return "Compounds";
  if (lower === "penthouse") return "Penthouses";
  if (lower === "shared") return "Shared";
  return type.endsWith("s") ? type : `${type}s`;
}

/**
 * Build dynamic title from current search params.
 * - No quotes around areas.
 * - 1 type: "Studios in City"
 * - 2 types: "Villas & Apartments in City & City"
 * - 3+ types: "Villas, Apartments, Studios in City, City, City"
 * - All property types plural (Studios, Villas, Apartments, etc.).
 */
export function buildDiscoverTitle(params: DiscoverSearchParams): string {
  const feed = params.feed === "uni-hub" ? "uni-hub" : "rentals";
  const types = parseList(params.type);
  const areas = parseList(params.area);

  const pluralTypes = types.map(pluralizeType);

  const formatTypes = (items: string[]) => {
    if (items.length <= 1) return items[0] ?? "";
    if (items.length === 2) return `${items[0]} & ${items[1]}`;
    return items.join(", ");
  };

  const formatAreas = (items: string[]) => {
    if (items.length <= 1) return items[0] ?? "";
    if (items.length === 2) return `${items[0]} & ${items[1]}`;
    return items.join(", ");
  };

  if (types.length && areas.length) {
    const typeStr = formatTypes(pluralTypes);
    const areaStr = formatAreas(areas);
    return `${typeStr} in ${areaStr}`;
  }
  if (areas.length) {
    const areaStr = formatAreas(areas);
    return `Listings in ${areaStr}`;
  }
  if (types.length) {
    return formatTypes(pluralTypes);
  }
  return feed === "uni-hub" ? "Uni Hub listings" : "Rentals";
}

export type FilterPillItem =
  | { id: string; label: string }
  | { id: "extra"; count: number };

/**
 * Build ordered filter pills from params.
 * Only includes pills for applied filters.
 * Hierarchy: Price Range -> Bed (or Studio) -> Bath -> EWA -> Extra (+N).
 */
export function buildFilterPills(params: DiscoverSearchParams): FilterPillItem[] {
  const pills: FilterPillItem[] = [];
  const priceMin = params.price_min?.trim();
  const priceMax = params.price_max?.trim();
  const beds = params.beds?.trim();
  const baths = params.baths?.trim();
  const ewa = params.ewa?.trim();

  if (priceMin || priceMax) {
    const min = priceMin ? `${priceMin}` : "";
    const max = priceMax ? `${priceMax}` : "";
    pills.push({
      id: "price",
      label: min && max ? `${min}-${max} BD` : min ? `${min}+ BD` : max ? `Up to ${max} BD` : "Price",
    });
  }

  if (beds !== undefined && beds !== "") {
    const lower = beds.toLowerCase();
    if (lower === "studio" || lower === "0") {
      pills.push({ id: "beds", label: "Studio" });
    } else {
      const n = parseInt(beds, 10);
      const label =
        Number.isNaN(n) ? `${beds} Bed(s)` : n === 1 ? "1 Bed" : `${n} Beds`;
      pills.push({ id: "beds", label });
    }
  }

  if (baths !== undefined && baths !== "") {
    const num = parseFloat(baths);
    const isOne = num === 1 || num === 1.5;
    const label =
      Number.isNaN(num)
        ? `${baths} Bath(s)`
        : isOne
          ? baths === "1.5"
            ? "1.5 Bath"
            : "1 Bath"
          : `${baths} Baths`;
    pills.push({ id: "baths", label });
  }

  if (ewa === "inclusive" || ewa === "exclusive") {
    pills.push({ id: "ewa", label: ewa });
  }

  const extraCount = Object.keys(params).filter(
    (k) =>
      params[k] !== undefined &&
      params[k] !== "" &&
      !HIERARCHY_KEYS.has(k)
  ).length;
  if (extraCount > 0) {
    pills.push({ id: "extra", count: extraCount });
  }

  return pills;
}
