/**
 * Filter sheet: property types (reuse main icons), pets, amenities (filter SVGs).
 * Type uses /icons/; pets and amenities use /icons/filters/Vector*.svg by design order.
 */

export const PROPERTY_TYPE_OPTIONS = [
  { id: "studio", label: "Studio", icon: "/icons/filters/Vector.svg" },
  { id: "apartment", label: "Apartment", icon: "/icons/apartment.svg" },
  { id: "villa", label: "Villa", icon: "/icons/villa.svg" },
  { id: "home", label: "Home", icon: "/icons/home.svg" },
  { id: "compound", label: "Compound", icon: "/icons/compound.svg" },
  { id: "penthouse", label: "Penthouse", icon: "/icons/penthouse.svg" },
  { id: "shared", label: "Shared", icon: "/icons/shared.svg" },
] as const;

export const PETS_OPTIONS = [
  { id: "dogs", label: "Dogs Allowed", icon: "/icons/filters/Vector-7.svg" },
  { id: "cats", label: "Cats Allowed", icon: "/icons/filters/Vector-8.svg" },
  { id: "dogs-cats", label: "Dogs & Cats Allowed", icon: "/icons/filters/Vector-9.svg" },
  { id: "no-pets", label: "No Pets", icon: "/icons/filters/Vector-13.svg" },
] as const;

/** Amenity icon filenames (slug.svg) matching AMENITIES_OPTIONS order; from named SVGs in public/icons/filters/ */
const AMENITY_ICONS = [
  "fully-furnished.svg",
  "semi-furnished.svg",
  "unfurnished.svg",
  "central-ac.svg",
  "mounted-ac.svg",
  "no-ac.svg",
  "maids-room.svg",
  "balcony.svg",
  "shared-pool.svg",
  "private-pool.svg",
  "shared-gym.svg",
  "private-gym.svg",
  "shared-spa.svg",
  "concierge-service.svg",
  "covered-parking.svg",
  "outdoor-parking.svg",
  "dedicated-parking-spot.svg",
  "view-of-landmark.svg",
  "sea-view.svg",
  "study.svg",
  "jacuzzi.svg",
  "built-in-wardrobes.svg",
  "walk-in-closet.svg",
  "built-in-washer.svg",
  "built-in-dryer.svg",
  "gated-compound.svg",
  "roof-access.svg",
  "barbecue-grill.svg",
  "maids-service.svg",
];

export const AMENITIES_OPTIONS = [
  "Fully Furnished",
  "Semi Furnished",
  "Unfurnished",
  "Central A/C",
  "Mounted A/C",
  "No A/C",
  "Maids Room",
  "Balcony",
  "Shared Pool",
  "Private Pool",
  "Shared Gym",
  "Private Gym",
  "Shared Spa",
  "Concierge Service",
  "Covered Parking",
  "Outdoor Parking",
  "Dedicated Parking Spot",
  "View of Landmark",
  "Sea View",
  "Study",
  "Jacuzzi",
  "Built-In Wardrobes",
  "Walk-In Closet",
  "Built-In Washer",
  "Built-In Dryer",
  "Gated Compound",
  "Roof Access",
  "Barbecue Grill",
  "Maids Service",
].map((label, i) => ({
  id: label.toLowerCase().replace(/\s+/g, "-").replace(/[&\/]/g, ""),
  label,
  icon: `/icons/filters/${AMENITY_ICONS[i] ?? "fully-furnished.svg"}`,
}));

/** Bedrooms display: Studio +, 1 +, 2 +, 3 +, 4 + */
export const BED_OPTIONS = [
  { value: "studio", label: "Studio +" },
  { value: "1", label: "1 +" },
  { value: "2", label: "2 +" },
  { value: "3", label: "3 +" },
  { value: "4+", label: "4 +" },
] as const;

/** Bathrooms display: 1 +, 1.5 +, 2 +, 2.5 +, 3 +, 3.5 +, 4 + */
export const BATH_OPTIONS = [
  { value: "1", label: "1 +" },
  { value: "1.5", label: "1.5 +" },
  { value: "2", label: "2 +" },
  { value: "2.5", label: "2.5 +" },
  { value: "3", label: "3 +" },
  { value: "3.5", label: "3.5 +" },
  { value: "4", label: "4 +" },
] as const;

/** Advanced bedrooms: Only Studio, Only 1, … Only 4 (no +) */
export const ADVANCED_BED_OPTIONS = [
  { value: "studio", label: "Only Studio" },
  { value: "1", label: "Only 1" },
  { value: "2", label: "Only 2" },
  { value: "3", label: "Only 3" },
  { value: "4+", label: "Only 4" },
] as const;

/** Advanced bathrooms: Only 1, Only 1.5, … Only 4 (no +, with .5 steps) */
export const ADVANCED_BATH_OPTIONS = [
  { value: "1", label: "Only 1" },
  { value: "1.5", label: "Only 1.5" },
  { value: "2", label: "Only 2" },
  { value: "2.5", label: "Only 2.5" },
  { value: "3", label: "Only 3" },
  { value: "3.5", label: "Only 3.5" },
  { value: "4", label: "Only 4" },
] as const;

export function formatListingCount(n: number): string {
  if (n < 5) return `${n} listings`;
  if (n < 10) return "5+ listings";
  if (n < 20) return "10+ listings";
  if (n < 100) {
    const tens = Math.ceil(n / 10) * 10;
    return `${tens}+ listings`;
  }
  if (n < 1000) return "100+ listings";
  if (n < 10000) return "1000+ listings";
  const tenthou = Math.ceil(n / 10000) * 10000;
  return `${tenthou.toLocaleString()}+ listings`;
}

export const BUDGET_MIN = 0;
export const BUDGET_MAX = 10_000;

export function formatBudgetWithCommas(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits === "") return "";
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("en-US");
}
