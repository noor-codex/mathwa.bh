"use client";

import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Minus, Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SectionId = "where" | "property-type" | "beds-baths" | "budget";

const BUDGET_MIN = 0;
const BUDGET_MAX = 10_000;

function formatBudgetWithCommas(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits === "") return "";
  const n = parseInt(digits, 10);
  if (Number.isNaN(n)) return "";
  return n.toLocaleString("en-US");
}

/** Bedroom/bathroom selector options (1–4+). Default = none selected. */
const BEDS_BATHS_OPTIONS = ["1", "2", "3", "4+"] as const;

/** Allowed property types on Mathwa (slug used in URL, label for display, icon path). */
const PROPERTY_TYPE_OPTIONS = [
  { slug: "studio", label: "Studio", icon: "/icons/studio.svg" },
  { slug: "apartment", label: "Apartment", icon: "/icons/apartment.svg" },
  { slug: "villa", label: "Villa", icon: "/icons/villa.svg" },
  { slug: "home", label: "Home", icon: "/icons/home.svg" },
  { slug: "compound", label: "Compound", icon: "/icons/compound.svg" },
  { slug: "penthouse", label: "Penthouse", icon: "/icons/penthouse.svg" },
  { slug: "shared", label: "Shared", icon: "/icons/shared.svg" },
] as const;

function parseList(param: string | undefined | null): string[] {
  if (!param?.trim()) return [];
  return param
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.trim().charAt(0).toUpperCase() + s.trim().slice(1).toLowerCase();
}

/** Suggested cities/areas for Where search (filtered by input). */
const SUGGESTED_AREAS = [
  "Manama, Bahrain",
  "Manama",
  "Al Khobar",
  "Al Khobar, Saudi Arabia",
  "Dammam",
  "Dammam, Saudi Arabia",
  "Diplomatic Area, Capital Governorate, Bahrain",
  "Juffair, Manama",
  "Juffair",
  "Manama Gate, Building 31, Manama",
  "Manama - United Arab Emirates",
  "Capital Governorate",
  "Muharraq",
  "Riffa",
  "Isa Town",
  "Sitra",
  "Hamad Town",
  "Nearby",
];

type DiscoverSearchSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feed: string;
};

export function DiscoverSearchSheet({
  open,
  onOpenChange,
  feed: feedProp,
}: DiscoverSearchSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panelRef = useRef<HTMLDivElement>(null);

  const [openSection, setOpenSection] = useState<SectionId | null>("where");
  const [feed, setFeed] = useState(feedProp);
  const [area, setArea] = useState("");
  const [typeList, setTypeList] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [beds, setBeds] = useState("");
  const [baths, setBaths] = useState("");
  const [bathsHalfError, setBathsHalfError] = useState(false);
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);
  const [budgetMinError, setBudgetMinError] = useState(false);
  const [budgetMaxError, setBudgetMaxError] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [searchButtonBounce, setSearchButtonBounce] = useState(false);
  const [whereSearchExpanded, setWhereSearchExpanded] = useState(false);
  /** Rect of the small "What city?" box when opening full-screen (for grow-from animation). */
  const [whereExpandOrigin, setWhereExpandOrigin] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const whereSearchBoxRef = useRef<HTMLDivElement>(null);
  const bathroomsSectionRef = useRef<HTMLDivElement>(null);
  const panelRefForClose = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setHasOpened(false);
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => setHasOpened(true));
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [open]);

  useEffect(() => {
    if (!open && !isClosing) return;
    if (!open) setIsClosing(true);
  }, [open, isClosing]);

  const handleCloseAnimationEnd = useCallback(() => {
    if (!isClosing) return;
    setIsClosing(false);
    setHasOpened(false);
    onOpenChange(false);
  }, [isClosing, onOpenChange]);

  useEffect(() => {
    if (open) {
      const feedParam = searchParams.get("feed") ?? feedProp;
      setFeed(feedParam === "uni-hub" ? "uni-hub" : "rentals");
      setArea(searchParams.get("area") ?? "");
      setTypeList(parseList(searchParams.get("type")).map((s) => s.toLowerCase()));
      setPriceMin(searchParams.get("price_min") ?? "");
      setPriceMax(searchParams.get("price_max") ?? "");
      setBeds(searchParams.get("beds") ?? "");
      setBaths(searchParams.get("baths") ?? "");
      setOpenSection("where");
      setBathsHalfError(false);
      setAdvancedSettingsOpen(false);
      setBudgetMinError(false);
      setBudgetMaxError(false);
      setWhereSearchExpanded(false);
      setWhereExpandOrigin(null);
    }
  }, [open, searchParams, feedProp]);

  useEffect(() => {
    if (!open && !isClosing) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsClosing(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isClosing]);

  const toggleType = useCallback((t: string) => {
    setTypeList((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );
    setOpenSection("beds-baths");
  }, []);

  const handleBudgetMinChange = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setPriceMin("");
      setBudgetMinError(false);
      return;
    }
    const n = parseInt(digits, 10);
    if (n > BUDGET_MAX) {
      setPriceMin(String(BUDGET_MAX));
      setBudgetMinError(true);
      setTimeout(() => setBudgetMinError(false), 500);
    } else if (n < BUDGET_MIN) {
      setPriceMin(String(BUDGET_MIN));
      setBudgetMinError(true);
      setTimeout(() => setBudgetMinError(false), 500);
    } else {
      setPriceMin(digits);
      setBudgetMinError(false);
    }
  }, []);

  const handleBudgetMaxChange = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setPriceMax("");
      setBudgetMaxError(false);
      return;
    }
    const n = parseInt(digits, 10);
    if (n > BUDGET_MAX) {
      setPriceMax(String(BUDGET_MAX));
      setBudgetMaxError(true);
      setTimeout(() => setBudgetMaxError(false), 500);
    } else if (n < BUDGET_MIN) {
      setPriceMax(String(BUDGET_MIN));
      setBudgetMaxError(true);
      setTimeout(() => setBudgetMaxError(false), 500);
    } else {
      setPriceMax(digits);
      setBudgetMaxError(false);
    }
  }, []);

  const reset = useCallback(() => {
    setArea("");
    setTypeList([]);
    setPriceMin("");
    setPriceMax("");
    setBeds("");
    setBaths("");
    setOpenSection("where");
    setAdvancedSettingsOpen(false);
    setBathsHalfError(false);
    setBudgetMinError(false);
    setBudgetMaxError(false);
  }, []);

  const apply = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("feed", feed);
    p.set("tab", "current-search");
    const areaTrim = area.trim();
    if (areaTrim) p.set("area", areaTrim);
    else p.delete("area");
    if (typeList.length > 0) p.set("type", typeList.join(","));
    else p.delete("type");
    const minNum = parseInt(priceMin.replace(/\D/g, ""), 10);
    const maxNum = parseInt(priceMax.replace(/\D/g, ""), 10);
    const minVal = !Number.isNaN(minNum) ? Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, minNum)) : null;
    const maxVal = !Number.isNaN(maxNum) ? Math.max(BUDGET_MIN, Math.min(BUDGET_MAX, maxNum)) : null;
    if (minVal != null) p.set("price_min", String(minVal));
    else p.delete("price_min");
    if (maxVal != null) p.set("price_max", String(maxVal));
    else p.delete("price_max");
    if (beds.trim()) p.set("beds", beds.trim());
    else p.delete("beds");
    if (baths.trim()) p.set("baths", baths.trim());
    router.replace(`${pathname}?${p.toString()}`);
    setIsClosing(true);
  }, [
    feed,
    pathname,
    area,
    typeList,
    priceMin,
    priceMax,
    beds,
    baths,
    searchParams,
    router,
  ]);

  const handleSearchClick = useCallback(() => {
    setSearchButtonBounce(true);
    apply();
    setTimeout(() => setSearchButtonBounce(false), 200);
  }, [apply]);

  const handleWhereSuggestionSelect = useCallback((suggestion: string) => {
    setArea(suggestion);
    setWhereSearchExpanded(false);
    setWhereExpandOrigin(null);
    setOpenSection("property-type");
  }, []);

  const openWhereFullscreen = useCallback(() => {
    const el = whereSearchBoxRef.current;
    const rect = el?.getBoundingClientRect();
    if (rect) {
      setWhereExpandOrigin({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setWhereExpandOrigin(null);
    }
    setWhereSearchExpanded(true);
  }, []);

  const closeWhereFullscreen = useCallback(() => {
    setWhereSearchExpanded(false);
    setWhereExpandOrigin(null);
  }, []);

  if (!open && !isClosing) return null;

  const areaChips = parseList(area.trim());
  const hasWhereChips = areaChips.length > 0;
  const whereClosedText = hasWhereChips
    ? areaChips.map((a) => capitalize(a)).join(", ")
    : "";
  const hasTypeChips = typeList.length > 0;
  const typeClosedText = hasTypeChips
    ? typeList
        .map((slug) => PROPERTY_TYPE_OPTIONS.find((o) => o.slug === slug)?.label ?? capitalize(slug))
        .join(", ")
    : "";
  const hasPriceChips = !!(priceMin.trim() || priceMax.trim());
  const hasBedsBathsChips = !!(beds.trim() || baths.trim());

  const budgetClosedText = (() => {
    const min = priceMin.replace(/\D/g, "");
    const max = priceMax.replace(/\D/g, "");
    const minN = min === "" ? null : parseInt(min, 10);
    const maxN = max === "" ? null : parseInt(max, 10);
    if (minN != null && maxN != null && !Number.isNaN(minN) && !Number.isNaN(maxN))
      return `${minN.toLocaleString("en-US")} BD to ${maxN.toLocaleString("en-US")} BD`;
    if (minN != null && !Number.isNaN(minN)) return `${minN.toLocaleString("en-US")}+ BD`;
    if (maxN != null && !Number.isNaN(maxN)) return `Up to ${maxN.toLocaleString("en-US")} BD`;
    return "";
  })();

  const bedsBathsClosedText = (() => {
    const parts: string[] = [];
    if (beds.trim()) parts.push(`${beds.trim()} ${beds.trim() === "1" ? "bed" : "beds"}`);
    if (baths.trim()) parts.push(`${baths.trim()} ${baths.trim() === "1" || baths.trim() === "1.5" ? "bath" : "baths"}`);
    return parts.join(", ");
  })();

  function Chip({ children }: { children: React.ReactNode }) {
    return (
      <span className="rounded-[10px] border border-[#374151] bg-[#F3F4F6] px-3 py-1.5 text-sm text-[#374151]">
        {children}
      </span>
    );
  }

  const isWhereOpen = openSection === "where";

  const isExpanded = open && hasOpened && !isClosing;

  const whereSuggestions = (() => {
    const q = area.trim().toLowerCase();
    if (!q) return SUGGESTED_AREAS.slice(0, 8);
    return SUGGESTED_AREAS.filter((s) => s.toLowerCase().includes(q)).slice(0, 10);
  })();

  return (
    <>
      {/* Blurred full-screen background – animate in/out */}
      <div
        className={cn(
          "fixed inset-0 z-[55] bg-white/70 backdrop-blur-md",
          isClosing && "animate-search-backdrop-close",
          isExpanded && "animate-search-backdrop-open",
          open && !hasOpened && "opacity-0"
        )}
        aria-hidden
        onClick={() => setIsClosing(true)}
      />
      {/* Content container: drawer from top, 5px from screen edges */}
      <div
        ref={panelRef}
        className="fixed inset-[5px] z-[60] flex flex-col items-center overflow-hidden py-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]"
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          ref={panelRefForClose}
          className={cn(
            "flex w-full max-w-[366px] flex-1 flex-col items-center overflow-y-auto overflow-x-hidden transition-transform",
            "origin-top",
            open && !hasOpened && !isClosing && "scale-y-0",
            isExpanded && "animate-search-drawer-open",
            isClosing && "animate-search-drawer-close"
          )}
          style={{ transformOrigin: "top center" }}
          onAnimationEnd={(e) => {
            const name = String(e.animationName ?? "");
            if (name.includes("search-drawer-close") || name.includes("search_drawer_close")) {
              handleCloseAnimationEnd();
            }
          }}
        >
        <div className="flex w-full max-w-[366px] flex-1 flex-col gap-4">
          {/* Where section – separate card per design */}
          <div
            className="relative flex flex-none flex-col gap-[15px] rounded-[20px] bg-[#FFFFFF] p-5 shadow-lg"
            style={{ padding: "20px 24px" }}
          >
            {/* Exit search – top right of card */}
            <button
              type="button"
              onClick={() => setIsClosing(true)}
              className="absolute right-5 top-5 z-10 flex items-center justify-center rounded p-1 text-[#374151] hover:bg-[#F3F4F6]"
              aria-label="Exit search"
            >
              <X className="h-5 w-5 shrink-0" />
            </button>
            {/* Uni Hub / Rentals switcher – always visible */}
            <div className="flex flex-row justify-center gap-[30px]">
              <button
                type="button"
                onClick={() => setFeed("uni-hub")}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "text-center text-[20px] leading-[24px]",
                    feed === "uni-hub" ? "font-semibold text-[#111111]" : "font-medium text-[#374151]"
                  )}
                >
                  Uni Hub
                </span>
                <span
                  className={cn(
                    "h-0.5 w-[29px] rounded",
                    feed === "uni-hub" ? "bg-[#111111]" : "bg-white"
                  )}
                  aria-hidden
                />
              </button>
              <button
                type="button"
                onClick={() => setFeed("rentals")}
                className="flex flex-col items-center gap-1.5"
              >
                <span
                  className={cn(
                    "text-center text-[20px] leading-[24px]",
                    feed === "rentals" ? "font-semibold text-[#111111]" : "font-medium text-[#374151]"
                  )}
                >
                  Rentals
                </span>
                <span
                  className={cn(
                    "h-0.5 w-[29px] rounded",
                    feed === "rentals" ? "bg-[#111111]" : "bg-white"
                  )}
                  aria-hidden
                />
              </button>
            </div>
            {/* Where? row: toggle collapse/expand (no nested buttons) */}
            <div className="flex w-full flex-row items-center justify-between gap-2 text-left">
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpenSection(isWhereOpen ? null : "where")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenSection(isWhereOpen ? null : "where");
                  }
                }}
                className="flex min-w-0 flex-1 flex-col items-stretch gap-1"
                aria-expanded={isWhereOpen}
              >
                <span className="flex items-center font-semibold text-[#0A0A0A]" style={{ fontSize: 25, lineHeight: "30px" }}>
                  Where?
                </span>
                {!isWhereOpen && hasWhereChips && (
                  <span className="flex items-center font-normal text-[#374151]/75" style={{ fontSize: 20, lineHeight: "24px" }}>
                    {whereClosedText}
                  </span>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpenSection(isWhereOpen ? null : "where")}
                  className="flex items-center justify-center rounded p-1 text-[#374151] hover:bg-[#F3F4F6]"
                  aria-label={isWhereOpen ? "Collapse" : "Expand"}
                >
                  {isWhereOpen ? (
                    <Minus className="h-5 w-5 shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 shrink-0" />
                  )}
                </button>
              </div>
            </div>
            {/* Expandable content: drawer in/out; click search bar to expand full-screen */}
            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                isWhereOpen ? "max-h-[220px] opacity-100" : "max-h-0 opacity-0"
              )}
            >
              <div
                ref={whereSearchBoxRef}
                role="button"
                tabIndex={0}
                onClick={openWhereFullscreen}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openWhereFullscreen();
                  }
                }}
                className="flex cursor-pointer flex-row items-center gap-2.5 rounded-[10px] border border-[#374151] bg-white px-4 py-[15px]"
              >
                <Search className="h-[15px] w-[15px] shrink-0 stroke-[1.665] text-[#374151]" aria-hidden />
                <Label htmlFor="search-where" className="sr-only">
                  What city?
                </Label>
                <Input
                  id="search-where"
                  type="text"
                  placeholder="What city?"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  onFocus={openWhereFullscreen}
                  className="min-h-0 flex-1 border-0 bg-transparent p-0 text-[20px] leading-6 text-[#0A0A0A] placeholder:text-[rgba(55,65,81,0.75)] focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <span className="flex items-center font-semibold text-[#707072]" style={{ fontSize: 18, lineHeight: "22px" }}>
                Recent searches
              </span>
            </div>
          </div>

          {/* Type – separate section card (design: 366×291 when open, Type? + 2-col grid) */}
          <div
            className="flex flex-none flex-col rounded-[20px] bg-[#FFFFFF] shadow-lg"
            style={{ padding: "20px 23.9977px 20px 23.9978px", gap: 15 }}
          >
            {openSection === "property-type" ? (
              <>
                <button
                  type="button"
                  onClick={() => setOpenSection(null)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                  aria-expanded="true"
                >
                  <span
                    className="flex items-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
                  >
                    Type?
                  </span>
                  <Minus className="h-5 w-5 shrink-0 text-[#374151]" />
                </button>
                {/* Frame 81: 2-col grid, 10px gap, buttons 154×44 */}
                <div className="grid grid-cols-[154px_154px] gap-x-[10px] gap-y-[10px]">
                  {PROPERTY_TYPE_OPTIONS.map(({ slug, label, icon }) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => toggleType(slug)}
                      className={cn(
                        "flex h-11 w-full min-w-0 flex-row items-center gap-2.5 rounded-[10px] border px-[15px] py-2.5 transition-colors",
                        typeList.includes(slug)
                          ? "border-[#374151] bg-[#F3F4F6] text-[#0A0A0A]"
                          : "border-[#374151] bg-white text-[#374151] hover:bg-[#F3F4F6]"
                      )}
                    >
                      <Image
                        src={icon}
                        alt=""
                        width={20}
                        height={20}
                        className="h-5 w-5 shrink-0 object-contain"
                        aria-hidden
                      />
                      <span
                        className="flex items-center font-normal text-[#374151]"
                        style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setOpenSection("property-type")}
                className="flex w-full flex-col items-stretch gap-[15px] text-left"
                aria-expanded="false"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="flex items-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
                  >
                    Type?
                  </span>
                  <Plus className="h-5 w-5 shrink-0 text-[#374151]" />
                </div>
                {hasTypeChips && (
                  <span
                    className="flex items-center font-normal text-[#374151]/75"
                    style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                  >
                    {typeClosedText}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Beds, Baths? – separate section card (366×275 when open) */}
          <div
            className="flex flex-none flex-col rounded-[20px] bg-[#FFFFFF] shadow-lg"
            style={{ padding: "20px 23.9977px 20px 23.9978px", gap: 15 }}
          >
            {openSection === "beds-baths" ? (
              <>
                <button
                  type="button"
                  onClick={() => setOpenSection(null)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                  aria-expanded="true"
                >
                  <span
                    className="flex items-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
                  >
                    Beds, Baths?
                  </span>
                  <Minus className="h-5 w-5 shrink-0 text-[#374151]" />
                </button>
                {/* Bedrooms */}
                <span
                  className="flex items-center font-semibold text-[#0A0A0A]"
                  style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
                >
                  Bedrooms
                </span>
                <div className="flex w-full max-w-[318px] gap-0">
                  {BEDS_BATHS_OPTIONS.map((opt) => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => setBeds(opt)}
                        className="flex h-8 w-[72px] flex-shrink-0 flex-col items-center justify-center gap-1.5"
                      >
                        <span
                          className={cn(
                            "flex items-center justify-center text-center font-normal",
                            beds === opt ? "font-medium text-[#1A1A1A]" : "text-[#374151]"
                          )}
                          style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                        >
                          {opt}
                        </span>
                      <span
                        className={cn("h-0.5 w-[29px] rounded", beds === opt ? "bg-[#1A1A1A]" : "opacity-0")}
                        aria-hidden
                      />
                    </button>
                  ))}
                </div>
                {/* Bathrooms */}
                <div ref={bathroomsSectionRef} className="flex flex-col gap-0">
                  <span
                    className={cn(
                      "flex items-center font-semibold transition-colors",
                      bathsHalfError ? "animate-shake text-red-500" : "text-[#0A0A0A]"
                    )}
                    style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
                  >
                    Bathrooms
                  </span>
                  <div className="flex w-full max-w-[318px] gap-0">
                  {BEDS_BATHS_OPTIONS.map((opt) => {
                    const showAsSelected = baths === opt || (opt !== "4+" && baths === `${opt}.5`);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          setBaths(opt);
                          setBathsHalfError(false);
                          setOpenSection("budget");
                        }}
                        className="flex h-8 w-[72px] flex-shrink-0 flex-col items-center justify-center gap-1.5"
                      >
                        <span
                          className={cn(
                            "flex items-center justify-center text-center font-normal",
                            showAsSelected ? "font-medium text-[#1A1A1A]" : "text-[#374151]"
                          )}
                          style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                        >
                          {opt}
                        </span>
                        <span
                          className={cn("h-0.5 w-[29px] rounded", showAsSelected ? "bg-[#1A1A1A]" : "opacity-0")}
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                  </div>
                </div>
                {/* Advanced settings: click to show .5 (half bath) selector */}
                <button
                  type="button"
                  onClick={() => setAdvancedSettingsOpen((o) => !o)}
                  className="flex items-center self-start font-medium text-[#707072] underline"
                  style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
                >
                  Advanced settings
                </button>
                {advancedSettingsOpen && (
                  <>
                    <span
                      className="flex items-center font-semibold text-[#0A0A0A]"
                      style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
                    >
                      Half bath
                    </span>
                    <div className="flex w-full max-w-[318px] gap-0">
                      <button
                        type="button"
                        onClick={() => {
                          const hasHalf = baths.includes(".5");
                          if (hasHalf) {
                            setBaths(baths.replace(".5", ""));
                            setBathsHalfError(false);
                            return;
                          }
                          const main = baths.replace(".5", "") || "";
                          if (main !== "1" && main !== "2" && main !== "3") {
                            setBathsHalfError(true);
                            bathroomsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                            setTimeout(() => setBathsHalfError(false), 1000);
                            return;
                          }
                          setBaths(main ? `${main}.5` : "1.5");
                          setBathsHalfError(false);
                        }}
                        className="flex h-8 w-[72px] flex-shrink-0 flex-col items-center justify-center gap-1.5"
                      >
                        <span
                          className={cn(
                            "flex items-center justify-center text-center font-normal",
                            baths.includes(".5") ? "font-medium text-[#1A1A1A]" : "text-[#374151]"
                          )}
                          style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                        >
                          .5
                        </span>
                        <span
                          className={cn("h-0.5 w-[29px] rounded", baths.includes(".5") ? "bg-[#1A1A1A]" : "opacity-0")}
                          aria-hidden
                        />
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => setOpenSection("beds-baths")}
                className="flex w-full flex-col items-stretch gap-[15px] text-left"
                aria-expanded="false"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="flex items-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
                  >
                    Beds, Baths?
                  </span>
                  <Plus className="h-5 w-5 shrink-0 text-[#374151]" />
                </div>
                {hasBedsBathsChips && (
                  <span
                    className="flex items-center font-normal text-[#374151]/75"
                    style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                  >
                    {bedsBathsClosedText}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Budget? – separate section card (366×119 when open), last in hierarchy */}
          <div
            className="flex flex-none flex-col rounded-[20px] bg-[#FFFFFF] shadow-lg"
            style={{ padding: "20px 23.9977px 20px 23.9978px", gap: 15 }}
          >
            {openSection === "budget" ? (
              <>
                <button
                  type="button"
                  onClick={() => setOpenSection(null)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                  aria-expanded="true"
                >
                  <span
                    className="flex items-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
                  >
                    Budget?
                  </span>
                  <Minus className="h-5 w-5 shrink-0 text-[#374151]" />
                </button>
                {/* Frame 82: minimum | to | maximum */}
                <div className="flex h-[34px] w-full max-w-[318px] flex-row items-center gap-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="minimum"
                    value={formatBudgetWithCommas(priceMin)}
                    onChange={(e) => handleBudgetMinChange(e.target.value)}
                    className={cn(
                      "h-[34px] flex-1 min-w-0 max-w-[99.33px] rounded-[10px] border bg-[#F3F4F6] px-[18px] py-1.5 text-center transition-colors",
                      "border-[#374151] placeholder:text-[rgba(55,65,81,0.75)] focus:outline-none focus:ring-1 focus:ring-[#374151]",
                      budgetMinError && "animate-shake border-red-500 bg-red-50 text-red-600"
                    )}
                    style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                    aria-label="Minimum budget (BD)"
                  />
                  <span
                    className="flex w-[99.33px] shrink-0 items-center justify-center font-normal text-[#374151]"
                    style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                  >
                    to
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="maximum"
                    value={formatBudgetWithCommas(priceMax)}
                    onChange={(e) => handleBudgetMaxChange(e.target.value)}
                    className={cn(
                      "h-[34px] flex-1 min-w-0 max-w-[99.33px] rounded-[10px] border bg-[#F3F4F6] px-[18px] py-1.5 text-center transition-colors",
                      "border-[#374151] placeholder:text-[rgba(55,65,81,0.75)] focus:outline-none focus:ring-1 focus:ring-[#374151]",
                      budgetMaxError && "animate-shake border-red-500 bg-red-50 text-red-600"
                    )}
                    style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                    aria-label="Maximum budget (BD)"
                  />
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setOpenSection("budget")}
                className="flex w-full flex-col items-stretch gap-[15px] text-left"
                aria-expanded="false"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="flex items-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
                  >
                    Budget?
                  </span>
                  <Plus className="h-5 w-5 shrink-0 text-[#374151]" />
                </div>
                {hasPriceChips && budgetClosedText && (
                  <span
                    className="flex items-center font-normal text-[#374151]/75"
                    style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
                  >
                    {budgetClosedText}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Bottom search container: Reset (left) + Search (right), 366×56 */}
          <div
            className="flex w-full max-w-[366px] flex-none flex-col items-stretch gap-[15px] rounded-[20px] px-[5px]"
            style={{ height: 56 }}
          >
            <div className="flex h-[56px] w-full max-w-[356px] flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={reset}
                className="flex items-center font-normal text-[#0A0A0A] underline"
                style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleSearchClick}
                className={cn(
                  "flex h-[56px] w-[163px] flex-shrink-0 flex-row items-center justify-end gap-2.5 rounded-[15px] bg-[#1A1A1A] px-[18px] py-2.5 text-white shadow-[0px_2px_4px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)] transition-colors hover:bg-[#1A1A1A]/90",
                  searchButtonBounce && "animate-search-button-bounce"
                )}
              >
                <Search className="h-[22px] w-[22px] shrink-0 stroke-[2] text-white" aria-hidden />
                <span
                  className="flex items-center font-semibold text-[#FFFFFF]"
                  style={{ fontFamily: "Figtree", fontSize: 30, lineHeight: "36px" }}
                >
                  Search
                </span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Full-screen Where search (Airbnb-style) when search bar is focused/clicked */}
      {whereSearchExpanded && (
        <div
          className={cn(
            "fixed inset-0 z-[65] flex flex-col bg-white",
            whereExpandOrigin ? "animate-where-fullscreen-grow" : "animate-where-fullscreen-open"
          )}
          role="dialog"
          aria-label="Search destinations"
          style={
            whereExpandOrigin
              ? {
                  // @ts-expect-error CSS custom properties for clip-path animation
                  "--where-inset-top": `${whereExpandOrigin.top}px`,
                  "--where-inset-right": `${typeof window !== "undefined" ? window.innerWidth - (whereExpandOrigin.left + whereExpandOrigin.width) : 0}px`,
                  "--where-inset-bottom": `${typeof window !== "undefined" ? window.innerHeight - (whereExpandOrigin.top + whereExpandOrigin.height) : 0}px`,
                  "--where-inset-left": `${whereExpandOrigin.left}px`,
                }
              : undefined
          }
        >
          {/* Search input: back arrow (returns to main sheet) + container */}
          <div className="flex flex-shrink-0 flex-row items-center gap-2.5 px-4 py-3">
            <div
              className="flex min-h-[54px] flex-1 flex-row items-center gap-2.5 rounded-[10px] border border-[#374151] px-4 py-[15px]"
              style={{ padding: "15px 16px", gap: 10 }}
            >
              <button
                type="button"
                onClick={closeWhereFullscreen}
                className="flex shrink-0 items-center justify-center rounded p-0.5 text-[#374151] hover:bg-[#F3F4F6]"
                aria-label="Back to search"
              >
                <ArrowLeft className="h-5 w-5 shrink-0 stroke-[1.665] text-[#374151]" aria-hidden />
              </button>
              <Label htmlFor="search-where-fullscreen" className="sr-only">
                What city?
              </Label>
              <Input
                id="search-where-fullscreen"
                type="text"
                placeholder="What city?"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="min-h-0 flex-1 border-0 bg-transparent p-0 text-[#0A0A0A] placeholder:text-[rgba(55,65,81,0.75)] focus-visible:ring-0 focus-visible:ring-offset-0"
                style={{ fontFamily: "Figtree", fontWeight: 400, fontSize: 20, lineHeight: "24px" }}
                autoFocus
              />
            </div>
          </div>
          {/* Suggestions: label fades out and collapses when typing (no gap) */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <span
              className={cn(
                "flex items-center font-semibold text-[#707072] transition-[opacity,margin,height] duration-200",
                area.trim()
                  ? "pointer-events-none h-0 min-h-0 overflow-hidden opacity-0"
                  : "mb-2"
              )}
              style={{ fontSize: 18, lineHeight: "22px" }}
              aria-hidden={!!area.trim()}
            >
              {area.trim() ? "Suggestions" : "Suggested destinations"}
            </span>
            <ul className={cn("flex flex-col gap-0", area.trim() && "mt-0")}>
              {whereSuggestions.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => handleWhereSuggestionSelect(suggestion)}
                    className="flex w-full items-center rounded-lg px-2 py-2.5 text-left text-[#0A0A0A] hover:bg-[#F3F4F6]"
                    style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
