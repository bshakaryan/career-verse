import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CareerVerse — Practice your next chapter",
  description:
    "Step into your first week as a Project Manager. Practice real decisions, work through trade-offs, and improve your plan.",
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
