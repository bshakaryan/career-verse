import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CareerVerse — Try a new job",
  description:
    "Explore careers in tech through interactive simulations and free starter lessons.",
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
