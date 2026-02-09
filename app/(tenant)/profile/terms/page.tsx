import { ProfileBackButton } from "@/components/profile/profile-back-button";

export default function TermsPage() {
  return (
    <div
      className="flex flex-col bg-white animate-slide-in-right"
      style={{ padding: "80px 20px 0px", gap: 20 }}
    >
      <ProfileBackButton href="/profile" />
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
        Terms of Service
      </h1>

      <p
        className="px-[5px] font-normal text-[#707072]"
        style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "22px" }}
      >
        Terms of service information coming soon.
      </p>
    </div>
  );
}
