"use client";

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProfileDetailRow, ProfileDetailSeparator } from "@/components/profile/profile-detail-row";
import { ProfileBackButton } from "@/components/profile/profile-back-button";
import { ChangePasswordSheet } from "@/components/sheets/change-password-sheet";
import { deleteAccount } from "@/lib/actions/profile";

type LoginSecurityClientProps = {
  passwordLastUpdated: string;
};

export function LoginSecurityClient({ passwordLastUpdated }: LoginSecurityClientProps) {
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDeleteAccount = useCallback(() => {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.success) {
        router.push("/login");
      }
    });
  }, [router]);

  return (
    <div
      className="flex flex-col bg-white animate-slide-in-right"
      style={{ padding: "80px 20px 0px", gap: 20 }}
    >
      <ProfileBackButton href="/profile/account-settings" />
      {/* Title */}
      <h1
        className="font-bold text-[#1A1A1A]"
        style={{
          fontFamily: "Figtree",
          fontSize: 32,
          lineHeight: "28px",
          letterSpacing: "-0.44px",
          paddingLeft: 5,
        }}
      >
        Login and Security
      </h1>

      {/* Fields */}
      <div className="flex flex-col">
        <ProfileDetailRow
          label="Password"
          value={passwordLastUpdated}
          onClick={() => setPasswordSheetOpen(true)}
        />
        <ProfileDetailSeparator />

        {/* Delete account row */}
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex w-full items-center justify-between"
          style={{ height: 88 }}
        >
          <div className="flex flex-col items-start justify-center gap-[10px] px-[15px]">
            <span
              className="font-medium underline"
              style={{
                fontFamily: "Figtree",
                fontSize: 17,
                lineHeight: "20px",
                color: "#E7080B",
              }}
            >
              Delete your account
            </span>
            <span
              className="font-bold"
              style={{
                fontFamily: "Figtree",
                fontSize: 17,
                lineHeight: "20px",
                color: "#C20000",
              }}
            >
              Deleting your account is permanent!
            </span>
          </div>
          {/* Red chevron */}
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path
              d="M7.5 5L12.5 10L7.5 15"
              stroke="#C20000"
              strokeWidth="1.66667"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <ProfileDetailSeparator color="#C20000" />
      </div>

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50">
          <div
            className="mx-6 flex w-full max-w-sm flex-col gap-4 rounded-[20px] bg-white p-6"
            style={{ boxShadow: "0px 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
          >
            <h3
              className="font-bold text-[#1A1A1A]"
              style={{ fontFamily: "Figtree", fontSize: 20, lineHeight: "24px" }}
            >
              Delete Account
            </h3>
            <p
              className="font-normal text-[#4A5565]"
              style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "20px" }}
            >
              Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex h-[44px] flex-1 items-center justify-center rounded-[12px] border border-[#E5E7EB] bg-white"
              >
                <span
                  className="font-medium text-[#1A1A1A]"
                  style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
                >
                  Cancel
                </span>
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isPending}
                className="flex h-[44px] flex-1 items-center justify-center rounded-[12px] bg-[#E7080B] disabled:opacity-50"
              >
                <span
                  className="font-medium text-white"
                  style={{ fontFamily: "Figtree", fontSize: 16, lineHeight: "19px" }}
                >
                  {isPending ? "Deleting..." : "Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change password sheet */}
      <ChangePasswordSheet
        open={passwordSheetOpen}
        onOpenChange={setPasswordSheetOpen}
      />
    </div>
  );
}
