"use client";

import { useState, useCallback, useTransition } from "react";
import { ActionBottomSheet } from "@/components/ui/action-bottom-sheet";
import { changePassword } from "@/lib/actions/profile";

type ChangePasswordSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChangePasswordSheet({
  open,
  onOpenChange,
}: ChangePasswordSheetProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = useCallback(() => {
    if (!currentPassword) {
      setError("Please enter your current password");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await changePassword(currentPassword, newPassword);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onOpenChange(false);
          setSuccess(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 1500);
      } else {
        setError(result.error || "Failed to change password");
      }
    });
  }, [currentPassword, newPassword, confirmPassword, onOpenChange]);

  return (
    <ActionBottomSheet open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col gap-6">
        {/* Title */}
        <h2
          className="font-bold text-[#1A1A1A]"
          style={{ fontFamily: "Figtree", fontSize: 24, lineHeight: "28px" }}
        >
          Change Password
        </h2>

        {success ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <span
              className="font-bold text-[#27C200]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Password updated successfully!
            </span>
          </div>
        ) : (
          <>
            {/* Current password */}
            <div className="flex flex-col gap-2">
              <label
                className="font-medium text-[#707072]"
                style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
              >
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 font-medium text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
                autoFocus
              />
            </div>

            {/* New password */}
            <div className="flex flex-col gap-2">
              <label
                className="font-medium text-[#707072]"
                style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
              >
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 font-medium text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
              />
            </div>

            {/* Confirm new password */}
            <div className="flex flex-col gap-2">
              <label
                className="font-medium text-[#707072]"
                style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
              >
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-4 py-3 font-medium text-[#1A1A1A] outline-none focus:border-[#1A1A1A]"
                style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
              />
            </div>

            {error && (
              <span
                className="font-medium text-[#E7080B]"
                style={{ fontFamily: "Figtree", fontSize: 14, lineHeight: "17px" }}
              >
                {error}
              </span>
            )}

            {/* Save button */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="flex h-[54px] w-full items-center justify-center rounded-[15px] bg-[#1A1A1A] disabled:opacity-50"
            >
              <span
                className="font-bold text-white"
                style={{ fontFamily: "Figtree", fontSize: 18, lineHeight: "22px" }}
              >
                {isPending ? "Updating..." : "Update Password"}
              </span>
            </button>
          </>
        )}
      </div>
    </ActionBottomSheet>
  );
}
