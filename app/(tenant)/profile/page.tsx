import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileMenuRow, ProfileMenuSeparator, ChevronRight } from "@/components/profile/profile-menu-row";
import { ProfileRentCard } from "./profile-rent-card";

// Menu icons as inline SVGs matching the design
function SettingsIcon() {
  return (
    <svg width="16" height="17" viewBox="0 0 16 17" fill="none">
      <path
        d="M6.5 1.5L6.1 3.3C5.7 3.5 5.3 3.7 5 3.9L3.2 3.3L1.7 5.9L3.1 7.2C3 7.5 3 7.7 3 8C3 8.3 3 8.5 3.1 8.8L1.7 10.1L3.2 12.7L5 12.1C5.3 12.3 5.7 12.5 6.1 12.7L6.5 14.5H9.5L9.9 12.7C10.3 12.5 10.7 12.3 11 12.1L12.8 12.7L14.3 10.1L12.9 8.8C13 8.5 13 8.3 13 8C13 7.7 13 7.5 12.9 7.2L14.3 5.9L12.8 3.3L11 3.9C10.7 3.7 10.3 3.5 9.9 3.3L9.5 1.5H6.5ZM8 5.5C9.4 5.5 10.5 6.6 10.5 8C10.5 9.4 9.4 10.5 8 10.5C6.6 10.5 5.5 9.4 5.5 8C5.5 6.6 6.6 5.5 8 5.5Z"
        stroke="#0A0A0A"
        strokeWidth="1.66545"
        fill="none"
      />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      <circle cx="8.5" cy="8.5" r="7" stroke="#0A0A0A" strokeWidth="1.66545" />
      <path
        d="M6.5 6.5C6.5 5.4 7.4 4.5 8.5 4.5C9.6 4.5 10.5 5.4 10.5 6.5C10.5 7.6 9.6 8.5 8.5 8.5V9.5"
        stroke="#0A0A0A"
        strokeWidth="1.66545"
        strokeLinecap="round"
      />
      <circle cx="8.5" cy="11.5" r="0.75" fill="#0A0A0A" />
    </svg>
  );
}

function PrivacyIcon() {
  return (
    <svg width="15" height="17" viewBox="0 0 15 17" fill="none">
      <rect x="1" y="7" width="13" height="9" rx="2" stroke="#0A0A0A" strokeWidth="1.66545" fill="none" />
      <path
        d="M4 7V5C4 2.8 5.3 1.5 7.5 1.5C9.7 1.5 11 2.8 11 5V7"
        stroke="#0A0A0A"
        strokeWidth="1.66545"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LegalIcon() {
  return (
    <svg width="17" height="15" viewBox="0 0 17 15" fill="none">
      <rect x="1" y="1" width="15" height="13" rx="2" stroke="#0A0A0A" strokeWidth="1.66545" fill="none" />
      <path d="M5 5H12" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 8H12" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 11H9" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function TermsIcon() {
  return (
    <svg width="14" height="17" viewBox="0 0 14 17" fill="none">
      <path
        d="M1 3C1 1.9 1.9 1 3 1H8L13 6V14C13 15.1 12.1 16 11 16H3C1.9 16 1 15.1 1 14V3Z"
        stroke="#0A0A0A"
        strokeWidth="1.66545"
        fill="none"
      />
      <path d="M8 1V6H13" stroke="#0A0A0A" strokeWidth="1.66545" strokeLinecap="round" />
      <path d="M4 10H10" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M4 13H8" stroke="#0A0A0A" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User";
  const avatarUrl = profile?.avatar_url as string | null;
  const roles = (profile?.roles as { tenant?: boolean; rental_manager?: boolean }) ?? {
    tenant: true,
  };
  const hasManagerRole = !!roles.rental_manager;

  return (
    <div
      className="flex flex-col bg-white"
      style={{ padding: "80px 20px 0px", gap: 20 }}
    >
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
        My Profile
      </h1>

      {/* Profile row */}
      <Link
        href="/profile"
        className="flex items-center justify-between"
        style={{
          height: 97,
          padding: "0 5px",
          borderBottom: "1px solid #E5E7EB",
        }}
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#F3F4F6]"
            style={{ width: 64, height: 64 }}
          >
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="font-semibold text-[#6A7282]"
                style={{ fontFamily: "Figtree", fontSize: 24 }}
              >
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Name and subtitle */}
          <div className="flex flex-col">
            <span
              className="font-semibold text-[#0A0A0A]"
              style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
            >
              {displayName}
            </span>
            <span
              className="font-normal text-[#6A7282]"
              style={{ fontFamily: "Figtree", fontSize: 15, lineHeight: "18px" }}
            >
              Show profile
            </span>
          </div>
        </div>

        <ChevronRight />
      </Link>

      {/* Rent your property card */}
      <ProfileRentCard hasManagerRole={hasManagerRole} />

      {/* Menu list */}
      <div className="flex flex-col">
        <ProfileMenuRow
          icon={<SettingsIcon />}
          label="Account settings"
          href="/profile/account-settings"
        />
        <ProfileMenuSeparator />

        <ProfileMenuRow
          icon={<SupportIcon />}
          label="Get support"
          href="/profile/get-support"
        />
        <ProfileMenuSeparator />

        <ProfileMenuRow
          icon={<PrivacyIcon />}
          label="Privacy"
          href="/profile/privacy"
        />
        <ProfileMenuSeparator />

        <ProfileMenuRow
          icon={<LegalIcon />}
          label="Legal"
          href="/profile/legal"
        />
        <ProfileMenuSeparator />

        <ProfileMenuRow
          icon={<TermsIcon />}
          label="Terms of Service"
          href="/profile/terms"
        />
        <ProfileMenuSeparator />
      </div>
    </div>
  );
}
