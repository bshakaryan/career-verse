import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CareerVerse — One crisis. Two careers.",
  description:
    "Experience Customer Support and QA in one connected workplace incident. Make decisions, switch perspectives, and discover your next practice step.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
