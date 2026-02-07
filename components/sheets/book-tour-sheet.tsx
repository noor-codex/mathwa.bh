"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ActionBottomSheet } from "@/components/ui/action-bottom-sheet";
import { ScrollWheelTimePicker } from "@/components/ui/scroll-wheel-picker";
import { cn } from "@/lib/utils";

type BookTourSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listingId: string;
  onBookingSuccess: (tourId: string) => void;
};

type DateOption = {
  date: Date;
  label: string;
  dayLabel: string;
};

// Bahrain timezone offset is UTC+3
const BAHRAIN_TIMEZONE = "Asia/Bahrain";

function getBahrainTime(): Date {
  // Get current time in Bahrain
  const now = new Date();
  const bahrainTime = new Date(now.toLocaleString("en-US", { timeZone: BAHRAIN_TIMEZONE }));
  return bahrainTime;
}

function generateDateOptions(): DateOption[] {
  const options: DateOption[] = [];
  const bahrainNow = getBahrainTime();
  
  for (let i = 0; i < 5; i++) {
    const date = new Date(bahrainNow);
    date.setDate(bahrainNow.getDate() + i);
    date.setHours(0, 0, 0, 0);
    
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dayLabel = `${dayNames[date.getDay()]} ${date.getDate()}`;
    
    options.push({
      date,
      label: i === 0 ? "Today" : dayNames[date.getDay()],
      dayLabel: i === 0 ? dayLabel : String(date.getDate()),
    });
  }
  
  return options;
}

// Get available hours based on period and whether it's today
function getAvailableHours(
  period: "AM" | "PM",
  isToday: boolean,
  bahrainHour: number,
  bahrainMinute: number
): number[] {
  // Base hours for 8 AM - 8 PM range
  // AM: 8, 9, 10, 11 (8 AM to 11:59 AM)
  // PM: 12, 1, 2, 3, 4, 5, 6, 7, 8 (12 PM noon to 8 PM)
  let baseHours: number[];
  
  if (period === "AM") {
    baseHours = [8, 9, 10, 11];
  } else {
    baseHours = [12, 1, 2, 3, 4, 5, 6, 7, 8];
  }
  
  if (!isToday) {
    return baseHours;
  }
  
  // Filter out hours that are less than 1 hour from now in Bahrain
  const minBookingHour24 = bahrainMinute >= 30 ? bahrainHour + 2 : bahrainHour + 1;
  
  return baseHours.filter((h) => {
    const hour24 = period === "PM" && h !== 12 ? h + 12 : (period === "AM" ? h : h);
    return hour24 >= minBookingHour24;
  });
}

// Get available minutes based on hour and whether it's today
function getAvailableMinutes(
  hour: number,
  period: "AM" | "PM",
  isToday: boolean,
  bahrainHour: number,
  bahrainMinute: number
): number[] {
  // 8:00 PM is the cutoff - if hour is 8 PM, only allow :00, not :30
  if (hour === 8 && period === "PM") {
    return [0];
  }
  
  const baseMinutes = [0, 30];
  
  if (!isToday) {
    return baseMinutes;
  }
  
  // Convert selected hour to 24-hour format
  const selectedHour24 = period === "PM" && hour !== 12 ? hour + 12 : (period === "AM" ? hour : hour);
  const minBookingHour24 = bahrainMinute >= 30 ? bahrainHour + 2 : bahrainHour + 1;
  
  // If the selected hour is exactly the minimum booking hour, check minutes
  if (selectedHour24 === minBookingHour24) {
    // If current minute is 30+, we need hour+2, so both 00 and 30 are fine
    // If current minute is 0-29, we need hour+1, so check if 00 or 30 works
    if (bahrainMinute < 30) {
      // Must be at least 1 hour from now, so if now is X:15, X+1:00 is not enough, need X+1:30
      return baseMinutes.filter((m) => m >= bahrainMinute);
    }
  }
  
  return baseMinutes;
}

// Check if a period is available based on today's time
function getAvailablePeriods(isToday: boolean, bahrainHour: number): ("AM" | "PM")[] {
  if (!isToday) {
    return ["AM", "PM"];
  }
  
  // If it's past 11 AM in Bahrain (considering +1 hour buffer), only PM is available
  // If it's past 7 PM, no times are available today (handled elsewhere)
  if (bahrainHour >= 11) {
    return ["PM"];
  }
  
  // If it's before 7 AM, only AM starting from 8 is available
  if (bahrainHour < 7) {
    return ["AM", "PM"];
  }
  
  return ["AM", "PM"];
}

export function BookTourSheet({
  open,
  onOpenChange,
  listingId,
  onBookingSuccess,
}: BookTourSheetProps) {
  const dateOptions = useMemo(() => generateDateOptions(), []);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState<"AM" | "PM">("AM");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isToday = selectedDateIndex === 0;
  const bahrainNow = useMemo(() => getBahrainTime(), []);
  const bahrainHour = bahrainNow.getHours();
  const bahrainMinute = bahrainNow.getMinutes();
  
  // Get available options based on current selection
  const availablePeriods = useMemo(
    () => getAvailablePeriods(isToday, bahrainHour),
    [isToday, bahrainHour]
  );
  
  const availableHours = useMemo(
    () => getAvailableHours(selectedPeriod, isToday, bahrainHour, bahrainMinute),
    [selectedPeriod, isToday, bahrainHour, bahrainMinute]
  );
  
  const availableMinutes = useMemo(
    () => getAvailableMinutes(selectedHour, selectedPeriod, isToday, bahrainHour, bahrainMinute),
    [selectedHour, selectedPeriod, isToday, bahrainHour, bahrainMinute]
  );
  
  // Ensure selected values are within available options
  useEffect(() => {
    if (!availablePeriods.includes(selectedPeriod)) {
      setSelectedPeriod(availablePeriods[0]);
    }
  }, [availablePeriods, selectedPeriod]);
  
  useEffect(() => {
    if (!availableHours.includes(selectedHour)) {
      setSelectedHour(availableHours[0] ?? 9);
    }
  }, [availableHours, selectedHour]);
  
  useEffect(() => {
    if (!availableMinutes.includes(selectedMinute)) {
      setSelectedMinute(availableMinutes[0] ?? 0);
    }
  }, [availableMinutes, selectedMinute]);
  
  // Handlers that prevent sheet from closing
  const handleHourChange = useCallback((hour: number) => {
    setSelectedHour(hour);
  }, []);
  
  const handleMinuteChange = useCallback((minute: number) => {
    setSelectedMinute(minute);
  }, []);
  
  const handlePeriodChange = useCallback((period: "AM" | "PM") => {
    setSelectedPeriod(period);
  }, []);

  const handleBookTour = async () => {
    setIsSubmitting(true);
    
    try {
      // Build the requested slot datetime
      const selectedDate = dateOptions[selectedDateIndex].date;
      let hour24 = selectedHour;
      if (selectedPeriod === "PM" && selectedHour !== 12) {
        hour24 += 12;
      } else if (selectedPeriod === "AM" && selectedHour === 12) {
        hour24 = 0;
      }
      
      const requestedSlot = new Date(selectedDate);
      requestedSlot.setHours(hour24, selectedMinute, 0, 0);

      // Import dynamically to avoid server action bundling issues
      const { createTourRequest } = await import("@/lib/actions/tours");
      const result = await createTourRequest(listingId, requestedSlot);

      if (result.success && result.tourId) {
        onBookingSuccess(result.tourId);
        onOpenChange(false);
      } else {
        console.error("Booking failed:", result.error);
        // Could show an error toast here
      }
    } catch (error) {
      console.error("Booking error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ActionBottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col items-center gap-5">
        {/* Header */}
        <div className="flex w-full flex-col items-start gap-0">
          <h2
            className="font-extrabold text-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "29px" }}
          >
            Book a tour
          </h2>
          <p
            className="font-bold text-[#717182]"
            style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
          >
            We&apos;ll send reminders before your tour so you can prepare.
          </p>
        </div>

        {/* Date picker */}
        <div className="flex w-full gap-3">
          {dateOptions.map((option, index) => {
            const isSelected = index === selectedDateIndex;
            const isToday = index === 0;
            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedDateIndex(index)}
                className={cn(
                  "flex h-[60px] w-[60px] flex-col items-center justify-center rounded-[15px] transition-colors",
                  isSelected
                    ? "bg-[#1A1A1A]"
                    : "border border-[#E5E7EB] bg-white"
                )}
              >
                <span
                  className={cn(
                    isSelected ? "text-white" : "text-[#374151]",
                    isToday && isSelected ? "font-semibold" : "font-medium"
                  )}
                  style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                >
                  {option.label}
                </span>
                {!isToday || !isSelected ? (
                  <span
                    className={cn(
                      "font-semibold",
                      isSelected ? "text-white" : "text-[#1A1A1A]"
                    )}
                    style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
                  >
                    {isToday ? option.dayLabel : option.dayLabel}
                  </span>
                ) : (
                  <span
                    className="font-medium text-white"
                    style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
                  >
                    {option.dayLabel}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Time picker */}
        <div className="w-full" onTouchStart={(e) => e.stopPropagation()}>
          <ScrollWheelTimePicker
            hour={selectedHour}
            minute={selectedMinute}
            period={selectedPeriod}
            onHourChange={handleHourChange}
            onMinuteChange={handleMinuteChange}
            onPeriodChange={handlePeriodChange}
            availableHours={availableHours}
            availableMinutes={availableMinutes}
            availablePeriods={availablePeriods}
          />
        </div>

        {/* Book Tour button */}
        <button
          type="button"
          onClick={handleBookTour}
          disabled={isSubmitting}
          className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)] disabled:opacity-50"
        >
          <span
            className="font-bold text-white"
            style={{ fontFamily: "Figtree", fontSize: 25, lineHeight: "30px" }}
          >
            {isSubmitting ? "Booking..." : "Book Tour"}
          </span>
        </button>
      </div>
    </ActionBottomSheet>
  );
}
