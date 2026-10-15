import type { Metadata } from "next";
import { SiteNav } from "@/components/site-nav";
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
        <SiteNav />
        {children}
        <footer className="border-t border-border">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-muted-foreground sm:flex-row sm:justify-between">
            <p>TutorMatch · Find Your Match. Learn Together. Grow Together.</p>
            <p>A student demo. No real money moves on TutorMatch.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
