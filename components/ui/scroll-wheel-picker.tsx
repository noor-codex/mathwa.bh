"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type ScrollWheelColumnProps = {
  items: { value: string | number; label: string }[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  width?: number;
};

const ITEM_HEIGHT = 48;
const VISIBLE_ITEMS = 3;

function ScrollWheelColumn({
  items,
  selectedValue,
  onSelect,
  width = 80,
}: ScrollWheelColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find the index of the selected value
  const selectedIndex = items.findIndex((item) => item.value === selectedValue);

  // Scroll to selected item on mount and when selectedValue changes
  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const scrollTop = selectedIndex * ITEM_HEIGHT;
      containerRef.current.scrollTop = scrollTop;
    }
  }, [selectedIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    isScrollingRef.current = true;

    // Debounce the selection update
    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const index = Math.round(scrollTop / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      
      if (items[clampedIndex] && items[clampedIndex].value !== selectedValue) {
        onSelect(items[clampedIndex].value);
      }
      
      // Snap to the item
      containerRef.current.scrollTo({
        top: clampedIndex * ITEM_HEIGHT,
        behavior: "smooth",
      });
      
      isScrollingRef.current = false;
    }, 100);
  }, [items, selectedValue, onSelect]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      style={{ width, height: ITEM_HEIGHT * VISIBLE_ITEMS }}
    >
      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="hide-scrollbar h-full overflow-y-auto"
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: ITEM_HEIGHT,
          paddingBottom: ITEM_HEIGHT,
        }}
        onScroll={handleScroll}
      >
        {items.map((item, index) => {
          const isSelected = item.value === selectedValue;
          return (
            <div
              key={`${item.value}-${index}`}
              className="flex items-center justify-center"
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: "center",
              }}
            >
              <span
                className={cn(
                  "text-center transition-colors duration-150",
                  isSelected ? "font-medium text-[#1A1A1A]" : "font-normal text-[#D1D5DC]"
                )}
                style={{
                  fontFamily: "Figtree",
                  fontSize: 24,
                  lineHeight: "36px",
                }}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type ScrollWheelTimePickerProps = {
  hour: number;
  minute: number;
  period: "AM" | "PM";
  onHourChange: (hour: number) => void;
  onMinuteChange: (minute: number) => void;
  onPeriodChange: (period: "AM" | "PM") => void;
  availableHours?: number[];
  availableMinutes?: number[];
  availablePeriods?: ("AM" | "PM")[];
};

export function ScrollWheelTimePicker({
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
  availableHours,
  availableMinutes,
  availablePeriods,
}: ScrollWheelTimePickerProps) {
  // Use provided hours or default to 8-12 for tour booking range
  const hourValues = availableHours ?? [8, 9, 10, 11, 12];
  const hours = hourValues.map((h) => ({
    value: h,
    label: String(h),
  }));

  // Use provided minutes or default to 00 and 30
  const minuteValues = availableMinutes ?? [0, 30];
  const minutes = minuteValues.map((m) => ({
    value: m,
    label: String(m).padStart(2, "0"),
  }));

  // Use provided periods or default to both
  const periodValues = availablePeriods ?? (["AM", "PM"] as const);
  const periods = periodValues.map((p) => ({
    value: p as "AM" | "PM",
    label: p,
  }));

  return (
    <div
      className="relative flex items-center justify-center gap-0"
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS + 10 }}
    >
      {/* Selection highlight bar spanning all columns */}
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 rounded-[14px]"
        style={{
          top: ITEM_HEIGHT + 5,
          height: ITEM_HEIGHT,
          width: 240,
          backgroundColor: "rgba(55, 65, 81, 0.1)",
        }}
      />
      <ScrollWheelColumn
        items={hours}
        selectedValue={hour}
        onSelect={(v) => onHourChange(v as number)}
        width={80}
      />
      <ScrollWheelColumn
        items={minutes}
        selectedValue={minute}
        onSelect={(v) => onMinuteChange(v as number)}
        width={80}
      />
      <ScrollWheelColumn
        items={periods}
        selectedValue={period}
        onSelect={(v) => onPeriodChange(v as "AM" | "PM")}
        width={80}
      />
    </div>
  );
}
