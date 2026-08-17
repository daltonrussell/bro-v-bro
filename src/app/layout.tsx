import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bro v Bro — Cross-game rivalries",
  description: "Pick games. Keep score. Loser gets the next pick.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
