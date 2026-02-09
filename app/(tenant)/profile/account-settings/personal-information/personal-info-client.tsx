"use client";

import { useState, useCallback } from "react";
import { ProfileDetailRow, ProfileDetailSeparator } from "@/components/profile/profile-detail-row";
import { ProfileBackButton } from "@/components/profile/profile-back-button";
import { ProfileFieldEditSheet } from "@/components/sheets/profile-field-edit-sheet";

type PersonalInfoClientProps = {
  displayName: string;
  phone: string;
  email: string;
  identityVerified: boolean;
};

type EditingField = {
  field: "display_name" | "phone" | "email";
  label: string;
  currentValue: string;
} | null;

export function PersonalInfoClient({
  displayName,
  phone,
  email,
  identityVerified,
}: PersonalInfoClientProps) {
  const [editingField, setEditingField] = useState<EditingField>(null);

  const handleEditName = useCallback(() => {
    setEditingField({
      field: "display_name",
      label: "Legal Name",
      currentValue: displayName,
    });
  }, [displayName]);

  const handleEditPhone = useCallback(() => {
    setEditingField({
      field: "phone",
      label: "Phone Number",
      currentValue: phone,
    });
  }, [phone]);

  const handleEditEmail = useCallback(() => {
    setEditingField({
      field: "email",
      label: "Email",
      currentValue: email,
    });
  }, [email]);

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
        Personal Information
      </h1>

      {/* Fields */}
      <div className="flex flex-col">
        <ProfileDetailRow
          label="Legal Name"
          value={displayName || "Not set"}
          onClick={handleEditName}
        />
        <ProfileDetailSeparator />

        <ProfileDetailRow
          label="Phone Number"
          value={phone || "Not set"}
          onClick={handleEditPhone}
        />
        <ProfileDetailSeparator />

        <ProfileDetailRow
          label="Email"
          value={email || "Not set"}
          onClick={handleEditEmail}
        />
        <ProfileDetailSeparator />

        <ProfileDetailRow
          label="Identity Verification"
          value={identityVerified ? "Verified" : "Not Verified"}
          valueColor={identityVerified ? "#27C200" : "#1A1A1A"}
        />
        <ProfileDetailSeparator />
      </div>

      {/* Edit sheet */}
      {editingField && (
        <ProfileFieldEditSheet
          open={!!editingField}
          onOpenChange={(open) => {
            if (!open) setEditingField(null);
          }}
          field={editingField.field}
          label={editingField.label}
          currentValue={editingField.currentValue}
        />
      )}
    </div>
  );
}
