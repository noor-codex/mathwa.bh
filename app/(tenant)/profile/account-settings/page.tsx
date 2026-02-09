import { ProfileMenuRow, ProfileMenuSeparator } from "@/components/profile/profile-menu-row";
import { ProfileBackButton } from "@/components/profile/profile-back-button";

// Person icon
function PersonIcon() {
  return (
    <svg width="14" height="18" viewBox="0 0 14 18" fill="none">
      <circle cx="7" cy="5" r="4" stroke="#0A0A0A" strokeWidth="2" fill="none" />
      <path
        d="M1 17C1 14 3.5 11 7 11C10.5 11 13 14 13 17"
        stroke="#0A0A0A"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// Lock/shield icon
function LockIcon() {
  return (
    <svg width="14" height="17" viewBox="0 0 14 17" fill="none">
      <circle cx="7" cy="5" r="4" stroke="#0A0A0A" strokeWidth="1.66545" fill="none" />
      <path
        d="M3 7V5C3 2.8 4.8 1 7 1C9.2 1 11 2.8 11 5V7"
        stroke="#0A0A0A"
        strokeWidth="1.66545"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="1" y="7" width="12" height="9" rx="2" stroke="#0A0A0A" strokeWidth="1.66545" fill="none" />
    </svg>
  );
}

export default function AccountSettingsPage() {
  return (
    <div
      className="flex flex-col bg-white animate-slide-in-right"
      style={{ padding: "80px 20px 0px", gap: 20 }}
    >
      <ProfileBackButton href="/profile" />
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
        Account Settings
      </h1>

      {/* Menu list */}
      <div className="flex flex-col">
        <ProfileMenuRow
          icon={<PersonIcon />}
          label="Personal information"
          href="/profile/account-settings/personal-information"
        />
        <ProfileMenuSeparator />

        <ProfileMenuRow
          icon={<LockIcon />}
          label="Login and security"
          href="/profile/account-settings/login-security"
        />
        <ProfileMenuSeparator />
      </div>
    </div>
  );
}
