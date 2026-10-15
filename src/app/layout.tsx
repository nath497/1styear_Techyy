import type { Metadata } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "TutorMatch — Find Your Match. Learn Together. Grow Together.",
  description:
    "Find student tutors in the Philippines who fit your subject, level and budget.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SiteShell>
          {children}
          <SiteFooter />
        </SiteShell>
      </body>
    </html>
  );
}
