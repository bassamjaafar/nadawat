import type { ReactNode } from "react";
import { AboutNav } from "@/components/admin/about/about-nav";

export default function AboutAdminLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <h1 className="text-h2 text-ink">إدارة صفحة عن ندوات</h1>
      <div className="mt-6">
        <AboutNav />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
