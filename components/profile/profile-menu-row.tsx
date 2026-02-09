import Link from "next/link";

type ProfileMenuRowProps = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

function ChevronRight({ color = "#99A1AF" }: { color?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M7.5 5L12.5 10L7.5 15"
        stroke={color}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileMenuRow({ icon, label, href }: ProfileMenuRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between"
      style={{ height: 58.5 }}
    >
      <div className="flex items-center gap-4 px-[15px]">
        <div className="flex items-center justify-center" style={{ width: 20, height: 20 }}>
          {icon}
        </div>
        <span
          className="font-medium text-[#0A0A0A]"
          style={{ fontFamily: "Figtree", fontSize: 17, lineHeight: "20px" }}
        >
          {label}
        </span>
      </div>
      <ChevronRight />
    </Link>
  );
}

export function ProfileMenuSeparator() {
  return (
    <div
      className="ml-[51px]"
      style={{
        height: 1,
        borderBottom: "0.5px solid rgba(60, 60, 67, 0.3)",
      }}
    />
  );
}

export { ChevronRight };
