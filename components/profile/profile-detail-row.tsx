"use client";

import { ChevronRight } from "./profile-menu-row";

type ProfileDetailRowProps = {
  label: string;
  value: string;
  valueColor?: string;
  chevronColor?: string;
  onClick?: () => void;
};

export function ProfileDetailRow({
  label,
  value,
  valueColor = "#1A1A1A",
  chevronColor = "#99A1AF",
  onClick,
}: ProfileDetailRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between"
      style={{ height: 88 }}
    >
      <div className="flex flex-col items-start justify-center gap-[10px] px-[15px]">
        <span
          className="font-medium text-[#707072]"
          style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
        >
          {label}
        </span>
        <span
          className="font-bold"
          style={{
            fontFamily: "Figtree",
            fontSize: 17,
            lineHeight: "20px",
            color: valueColor,
          }}
        >
          {value}
        </span>
      </div>
      <ChevronRight color={chevronColor} />
    </button>
  );
}

export function ProfileDetailSeparator({ color }: { color?: string }) {
  return (
    <div
      className="ml-[15px]"
      style={{
        height: 1,
        borderBottom: `0.5px solid ${color || "rgba(60, 60, 67, 0.3)"}`,
      }}
    />
  );
}
