import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CareerVerse — Practice your next chapter",
  description:
    "Explore careers through realistic work simulations. Start with Project Management, practice real decisions, and improve your plan.",
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
