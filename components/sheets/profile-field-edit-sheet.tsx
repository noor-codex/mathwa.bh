"use client";

import { useState, useCallback, useTransition } from "react";
import { ActionBottomSheet } from "@/components/ui/action-bottom-sheet";
import { updateProfileField } from "@/lib/actions/profile";
import { useRouter } from "next/navigation";

type ProfileFieldEditSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: "display_name" | "phone" | "email";
  label: string;
  currentValue: string;
};

export function ProfileFieldEditSheet({
  open,
  onOpenChange,
  field,
  label,
  currentValue,
}: ProfileFieldEditSheetProps) {
  const [value, setValue] = useState(currentValue);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSave = useCallback(() => {
    if (!value.trim()) {
      setError(`${label} cannot be empty`);
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await updateProfileField(field, value.trim());
      if (result.success) {
        onOpenChange(false);
        router.refresh();
      } else {
        setError(result.error || "Failed to update");
      }
    });
  }, [value, field, label, onOpenChange, router]);

  return (
    <ActionBottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <h2
          className="font-bold text-[#1A1A1A]"
          style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "28px" }}
        >
          Edit {label}
        </h2>

        {/* Input */}
        <div className="flex flex-col gap-2">
          <label
            className="font-medium text-[#707072]"
            style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
          >
            {label}
          </label>
          <input
            type={field === "email" ? "email" : field === "phone" ? "tel" : "text"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 font-medium text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
            style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
            autoFocus
          />
          {error && (
            <span
              className="font-medium text-[#E7080B]"
              style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
            >
              {error}
            </span>
          )}
        </div>

        {/* Save button */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending || value.trim() === currentValue}
          className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] disabled:opacity-50"
        >
          <span
            className="font-bold text-white"
            style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
          >
            {isPending ? "Saving..." : "Save"}
          </span>
        </button>
      </div>
    </ActionBottomSheet>
  );
}
