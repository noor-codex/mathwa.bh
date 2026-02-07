"use client";

import Image from "next/image";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PROPERTY_TYPE_OPTIONS,
  PETS_OPTIONS,
  AMENITIES_OPTIONS,
  BED_OPTIONS,
  BATH_OPTIONS,
  ADVANCED_BED_OPTIONS,
  ADVANCED_BATH_OPTIONS,
  formatListingCount,
  formatBudgetWithCommas,
  BUDGET_MIN,
  BUDGET_MAX,
} from "./discover-filter-constants";

type DiscoverFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feed: string;
};

function parseList(param: string | undefined): string[] {
  if (!param?.trim()) return [];
  return param.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function DiscoverFilterSheet({
  open,
  onOpenChange,
  feed,
}: DiscoverFilterSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const [typeList, setTypeList] = useState<string[]>([]);
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [beds, setBeds] = useState("studio");
  const [baths, setBaths] = useState("1");
  const [bedsOnly, setBedsOnly] = useState(false);
  const [bathsOnly, setBathsOnly] = useState(false);
  const [petsList, setPetsList] = useState<string[]>([]);
  const [amenitiesList, setAmenitiesList] = useState<string[]>([]);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [viewportWidthPx, setViewportWidthPx] = useState<number | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);

  // Force sheet to full visual viewport width (fixes mobile where 100vw/100% can be wrong)
  useEffect(() => {
    if (!open || typeof window === "undefined") return;
    const measure = () => {
      const w =
        window.visualViewport?.width ??
        document.documentElement.clientWidth ??
        window.innerWidth;
      setViewportWidthPx(w);
    };
    measure();
    window.visualViewport?.addEventListener("resize", measure);
    window.addEventListener("resize", measure);
    return () => {
      window.visualViewport?.removeEventListener("resize", measure);
      window.removeEventListener("resize", measure);
    };
  }, [open]);

  // Sync from URL when sheet opens (defaults: Studio +, 1 +)
  useEffect(() => {
    if (!open) return;
    setPriceMin(searchParams.get("price_min") ?? "");
    setPriceMax(searchParams.get("price_max") ?? "");
    const typeParam = searchParams.get("type") ?? undefined;
    setTypeList(parseList(typeParam));
    const b = searchParams.get("beds")?.trim().toLowerCase() ?? "";
    setBeds(b === "0" || b === "" ? "studio" : b);
    const bathsParam = searchParams.get("baths")?.trim() ?? "";
    setBaths(bathsParam === "" ? "1" : bathsParam);
    setBedsOnly(searchParams.get("beds_only") === "true");
    setBathsOnly(searchParams.get("baths_only") === "true");
    setPetsList([]);
    setAmenitiesList([]);
  }, [open, searchParams]);

  // Reset isClosing and drag when sheet opens
  useEffect(() => {
    if (open) {
      setIsClosing(false);
      setDragOffset(0);
      touchStartYRef.current = null;
    }
  }, [open]);

  // Cleanup close timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const CLOSE_ANIMATION_MS = 300;
  const requestClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      closeTimeoutRef.current = null;
      onOpenChange(false);
      setIsClosing(false);
    }, CLOSE_ANIMATION_MS);
  }, [isClosing, onOpenChange]);

  const SWIPE_CLOSE_THRESHOLD_PX = 80;
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    touchStartYRef.current = e.touches[0].clientY;
  }, []);
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartYRef.current == null || e.touches.length === 0) return;
    const y = e.touches[0].clientY;
    const deltaY = y - touchStartYRef.current;
    if (deltaY > 0) {
      e.preventDefault();
      dragOffsetRef.current = deltaY;
      setDragOffset(deltaY);
    }
  }, []);
  const handleTouchEnd = useCallback(() => {
    if (dragOffsetRef.current >= SWIPE_CLOSE_THRESHOLD_PX) {
      setDragOffset(0);
      dragOffsetRef.current = 0;
      touchStartYRef.current = null;
      requestClose();
    } else {
      setDragOffset(0);
      dragOffsetRef.current = 0;
      touchStartYRef.current = null;
    }
  }, [requestClose]);
  const handleTouchCancel = useCallback(() => {
    setDragOffset(0);
    dragOffsetRef.current = 0;
    touchStartYRef.current = null;
  }, []);

  // Build query string for count from current state (no area from sheet; keep from URL)
  const countQuery = useMemo(() => {
    const p = new URLSearchParams();
    p.set("feed", feed);
    const area = searchParams.get("area");
    if (area) p.set("area", area);
    if (typeList.length > 0) p.set("type", typeList.join(","));
    if (priceMin.trim()) p.set("price_min", priceMin.replace(/\D/g, ""));
    if (priceMax.trim()) p.set("price_max", priceMax.replace(/\D/g, ""));
    if (beds) p.set("beds", beds === "studio" ? "0" : beds);
    if (baths) p.set("baths", baths);
    if (bedsOnly) p.set("beds_only", "true");
    if (bathsOnly) p.set("baths_only", "true");
    return p.toString();
  }, [feed, searchParams, typeList, priceMin, priceMax, beds, baths, bedsOnly, bathsOnly]);

  // Fetch count when open; debounce when filters change
  useEffect(() => {
    if (!open) return;
    const fetchCount = () => {
      setCountLoading(true);
      fetch(`/api/discover/count?${countQuery}`)
        .then((res) => res.json())
        .then((data: { count?: number }) => setListingCount(data.count ?? 0))
        .catch(() => setListingCount(0))
        .finally(() => setCountLoading(false));
    };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchCount, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [open, countQuery]);

  const apply = useCallback(() => {
    const p = new URLSearchParams(searchParams.toString());
    p.set("feed", feed);
    p.set("tab", "current-search");
    if (priceMin.trim()) p.set("price_min", priceMin.replace(/\D/g, "").trim());
    else p.delete("price_min");
    if (priceMax.trim()) p.set("price_max", priceMax.replace(/\D/g, "").trim());
    else p.delete("price_max");
    if (typeList.length > 0) p.set("type", typeList.join(","));
    else p.delete("type");
    if (beds) p.set("beds", beds === "studio" ? "0" : beds);
    else p.delete("beds");
    if (baths) p.set("baths", baths);
    else p.delete("baths");
    if (bedsOnly) p.set("beds_only", "true");
    else p.delete("beds_only");
    if (bathsOnly) p.set("baths_only", "true");
    else p.delete("baths_only");
    router.replace(`${pathname}?${p.toString()}`);
    requestClose();
  }, [feed, pathname, priceMin, priceMax, typeList, beds, baths, bedsOnly, bathsOnly, searchParams, router, requestClose]);

  const reset = useCallback(() => {
    setTypeList([]);
    setPriceMin("");
    setPriceMax("");
    setBeds("studio");
    setBaths("1");
    setBedsOnly(false);
    setBathsOnly(false);
    setPetsList([]);
    setAmenitiesList([]);
    const p = new URLSearchParams();
    p.set("feed", feed);
    p.set("tab", "current-search");
    router.replace(`${pathname}?${p.toString()}`);
  }, [feed, pathname, router]);

  const handleBudgetMinChange = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setPriceMin("");
      return;
    }
    const n = parseInt(digits, 10);
    if (n > BUDGET_MAX) setPriceMin(String(BUDGET_MAX));
    else setPriceMin(digits);
  }, []);

  const handleBudgetMaxChange = useCallback((raw: string) => {
    const digits = raw.replace(/\D/g, "");
    if (digits === "") {
      setPriceMax("");
      return;
    }
    const n = parseInt(digits, 10);
    if (n > BUDGET_MAX) setPriceMax(String(BUDGET_MAX));
    else setPriceMax(digits);
  }, []);

  const toggleType = (id: string) => {
    setTypeList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const togglePets = (id: string) => {
    setPetsList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleAmenity = (id: string) => {
    setAmenitiesList((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const bedIndex = BED_OPTIONS.findIndex((o) => o.value === beds);
  const bathIndex = BATH_OPTIONS.findIndex((o) => o.value === baths);

  const incBeds = () => {
    if (bedIndex < 0) setBeds(BED_OPTIONS[0].value);
    else if (bedIndex < BED_OPTIONS.length - 1) setBeds(BED_OPTIONS[bedIndex + 1].value);
  };
  const decBeds = () => {
    if (bedIndex > 0) setBeds(BED_OPTIONS[bedIndex - 1].value);
    else if (bedIndex === 0) setBeds("");
  };

  const incBaths = () => {
    if (bathIndex < 0) setBaths(BATH_OPTIONS[0].value);
    else if (bathIndex < BATH_OPTIONS.length - 1) setBaths(BATH_OPTIONS[bathIndex + 1].value);
  };
  const decBaths = () => {
    if (bathIndex > 0) setBaths(BATH_OPTIONS[bathIndex - 1].value);
    else if (bathIndex === 0) setBaths("");
  };

  const showListingsLabel = countLoading
    ? "Show listings"
    : listingCount !== null
      ? `Show ${formatListingCount(listingCount)}`
      : "Show listings";

  if (!open && !isClosing) return null;

  const sectionLabelClass = "font-medium text-[#0A0A0A]";
  const sectionLabelStyle = { fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" };
  const tagClass =
    "box-border flex flex-row items-center justify-center gap-1.5 rounded-[10px] border border-[#374151] px-2.5 py-1.5";
  const tagTextClass = "font-medium text-center text-[#374151]";
  const tagTextStyle = { fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" };
  const separatorClass = "w-full border-t border-black/10";

  const content = (
    <>
      <div
        className="fixed inset-0 z-[55] bg-black/50"
        style={
          viewportWidthPx != null
            ? {
                position: "fixed",
                left: 0,
                top: 0,
                bottom: 0,
                width: viewportWidthPx,
                minWidth: viewportWidthPx,
                zIndex: 55,
              }
            : undefined
        }
        aria-hidden
        onClick={requestClose}
      />
      <div
        ref={sheetRef}
        className={cn(
          "flex flex-col rounded-t-[32px] bg-white shadow-[0px_5px_15px_-12px_rgba(0,0,0,0.1)]",
          isClosing ? "animate-filter-sheet-close" : "animate-filter-sheet-open"
        )}
        style={{
          position: "fixed",
          zIndex: 60,
          left: 0,
          top: 40,
          right: 0,
          bottom: 0,
          width: viewportWidthPx != null ? viewportWidthPx : "100vw",
          minWidth: viewportWidthPx != null ? viewportWidthPx : "100vw",
          maxWidth: "none",
          boxSizing: "border-box",
          margin: 0,
          transform: !isClosing && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          WebkitBackfaceVisibility: "hidden",
          backfaceVisibility: "hidden",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
      >
        <div
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col gap-[15px] overflow-y-auto overscroll-contain rounded-t-[20px] bg-white px-6 py-5",
            isClosing && "pointer-events-none"
          )}
        >
          <div
            className="flex flex-col items-center gap-3 pt-2 pb-1 touch-none md:touch-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
          >
            <div
              className="h-1.5 w-14 shrink-0 rounded-full bg-[#D1D5DB] md:hidden"
              aria-hidden
            />
            <div className="flex w-full items-center justify-between gap-3">
              <h2
                className="flex items-center font-bold text-[#0A0A0A]"
                style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
              >
                Filters
              </h2>
              <button
                type="button"
                onClick={requestClose}
                aria-label="Close filters"
                className="flex shrink-0 items-center justify-center rounded-full p-1.5 text-[#0A0A0A] hover:bg-black/5 active:bg-black/10"
              >
                <X className="h-6 w-6 stroke-[2]" />
              </button>
            </div>
          </div>

          <span className={cn(sectionLabelClass)} style={sectionLabelStyle}>
            Type of property
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_TYPE_OPTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleType(id)}
                className={cn(
                  tagClass,
                  typeList.includes(id) && "border-[#1A1A1A] bg-[#F3F4F6]"
                )}
              >
                <Image src={icon} alt="" width={18} height={18} className="shrink-0" style={{ width: "auto", height: "auto" }} />
                <span className={tagTextClass} style={tagTextStyle}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          <div className={separatorClass} />

          <span className={cn(sectionLabelClass)} style={sectionLabelStyle}>
            Budget
          </span>
          <p
            className="text-[#707072]"
            style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
          >
            Does not include potential security deposit
          </p>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder="minimum"
              value={formatBudgetWithCommas(priceMin)}
              onChange={(e) => handleBudgetMinChange(e.target.value)}
              className="h-[34px] w-[99px] rounded-[10px] border border-[#374151] bg-[#F3F4F6] px-[18px] py-1.5 text-[15px] leading-[18px] text-[#374151] placeholder:text-[rgba(55,65,81,0.75)]"
              style={{ fontFamily: "Figtree" }}
            />
            <span
              className="text-[#374151]"
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
              className="h-[34px] w-[99px] rounded-[10px] border border-[#374151] bg-[#F3F4F6] px-[18px] py-1.5 text-[15px] leading-[18px] text-[#374151] placeholder:text-[rgba(55,65,81,0.75)]"
              style={{ fontFamily: "Figtree" }}
            />
          </div>

          <div className={separatorClass} />

          <span className={cn(sectionLabelClass)} style={sectionLabelStyle}>
            Beds & Baths
          </span>
          <div className="flex min-w-0 flex-col gap-4">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-black"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  Bedrooms
                </span>
                <div className="ml-auto flex h-11 items-center gap-2 rounded-[10px] sm:gap-3">
                  <button
                    type="button"
                    onClick={decBeds}
                    className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#F3F4F6] touch-manipulation active:bg-[#E5E7EB]"
                  >
                    <Minus className="h-4 w-4 stroke-[2] text-[#0A0A0A] sm:h-3 sm:w-3" />
                  </button>
                  <span
                    className="min-w-[80px] text-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                  >
                    {beds
                      ? bedsOnly
                        ? (BED_OPTIONS.find((o) => o.value === beds)?.label.replace(/ \+$/, "") ?? "Studio")
                        : (BED_OPTIONS.find((o) => o.value === beds)?.label ?? "Studio +")
                      : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={incBeds}
                    className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#F3F4F6] touch-manipulation active:bg-[#E5E7EB]"
                  >
                    <Plus className="h-4 w-4 stroke-[2] text-[#0A0A0A] sm:h-3 sm:w-3" />
                  </button>
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p
                  className="min-w-0 shrink text-[13px] leading-tight text-[#707072]"
                  style={{ fontFamily: "Figtree" }}
                >
                  {beds ? ADVANCED_BED_OPTIONS.find((o) => o.value === beds)?.label ?? "Only Studio" : "Only Studio"}?
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bedsOnly}
                  onClick={() => setBedsOnly((v) => !v)}
                  style={{
                      width: 36,
                      height: 20,
                      backgroundColor: bedsOnly ? "#1A1A1A" : "#E5E7EB",
                      flexShrink: 0,
                    }}
                    className={cn(
                      "relative inline-flex shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#374151] focus-visible:ring-offset-2"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute top-[2px] inline-block rounded-full bg-white shadow"
                      )}
                      style={{
                        left: bedsOnly ? 18 : 2,
                        width: 16,
                        height: 16,
                      }}
                  />
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="font-semibold text-black"
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  Bathrooms
                </span>
                <div className="ml-auto flex h-11 items-center gap-2 rounded-[10px] sm:gap-3">
                  <button
                    type="button"
                    onClick={decBaths}
                    className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#F3F4F6] touch-manipulation active:bg-[#E5E7EB]"
                  >
                    <Minus className="h-4 w-4 stroke-[2] text-[#0A0A0A] sm:h-3 sm:w-3" />
                  </button>
                  <span
                    className="min-w-[80px] text-center font-semibold text-[#0A0A0A]"
                    style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                  >
                    {baths
                      ? bathsOnly
                        ? (BATH_OPTIONS.find((o) => o.value === baths)?.label.replace(/ \+$/, "") ?? "1")
                        : (BATH_OPTIONS.find((o) => o.value === baths)?.label ?? "1 +")
                      : "—"}
                  </span>
                  <button
                    type="button"
                    onClick={incBaths}
                    className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-[10px] bg-[#F3F4F6] touch-manipulation active:bg-[#E5E7EB]"
                  >
                    <Plus className="h-4 w-4 stroke-[2] text-[#0A0A0A] sm:h-3 sm:w-3" />
                  </button>
                </div>
              </div>
              <div className="flex min-w-0 items-center justify-between gap-2">
                <p
                  className="min-w-0 shrink text-[13px] leading-tight text-[#707072]"
                  style={{ fontFamily: "Figtree" }}
                >
                  {baths ? ADVANCED_BATH_OPTIONS.find((o) => o.value === baths)?.label ?? "Only 1" : "Only 1"}?
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={bathsOnly}
                  onClick={() => setBathsOnly((v) => !v)}
                  style={{
                      width: 36,
                      height: 20,
                      backgroundColor: bathsOnly ? "#1A1A1A" : "#E5E7EB",
                      flexShrink: 0,
                    }}
                    className={cn(
                      "relative inline-flex shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#374151] focus-visible:ring-offset-2"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute top-[2px] inline-block rounded-full bg-white shadow"
                      )}
                      style={{
                        left: bathsOnly ? 18 : 2,
                        width: 16,
                        height: 16,
                      }}
                  />
                </button>
              </div>
            </div>
          </div>

          <div className={separatorClass} />

          <span className={cn(sectionLabelClass)} style={sectionLabelStyle}>
            Pets
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PETS_OPTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => togglePets(id)}
                className={cn(
                  tagClass,
                  petsList.includes(id) && "border-[#1A1A1A] bg-[#F3F4F6]"
                )}
              >
                <Image src={icon} alt="" width={18} height={18} className="shrink-0" style={{ width: "auto", height: "auto" }} />
                <span className={tagTextClass} style={tagTextStyle}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          <div className={separatorClass} />

          <span className={cn(sectionLabelClass)} style={sectionLabelStyle}>
            Amenities
          </span>
          <div className="flex flex-wrap gap-1.5">
            {AMENITIES_OPTIONS.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleAmenity(id)}
                className={cn(
                  tagClass,
                  amenitiesList.includes(id) && "border-[#1A1A1A] bg-[#F3F4F6]"
                )}
              >
                <Image src={icon} alt="" width={18} height={18} className="shrink-0" style={{ width: "auto", height: "auto" }} />
                <span className={tagTextClass} style={tagTextStyle}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-2 bg-white px-6 pb-6 pt-2.5 shadow-[0px_-5px_5px_rgba(0,0,0,0.15)]">
          <button
            type="button"
            onClick={reset}
            className="font-normal text-[#0A0A0A] underline"
            style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={apply}
            className="flex items-center justify-end gap-2.5 rounded-[10px] bg-[#1A1A1A] px-2.5 py-1.5 text-white shadow-[0px_2px_4px_rgba(0,0,0,0.1),0px_4px_6px_rgba(0,0,0,0.1)]"
          >
            <span
              className="font-semibold text-white"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              {showListingsLabel}
            </span>
          </button>
        </div>
      </div>
    </>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : null;
}
