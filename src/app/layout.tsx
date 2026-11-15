import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CareerVerse — One Bug. Three Roles.",
  description:
    "Experience Customer Support, Software Development and QA in one short, connected workplace mission.",
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
