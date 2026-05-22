import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PizzaDAO Bingo — Global Pizza Party",
  description: "Multiplayer web3 bingo for the Global Pizza Party by PizzaDAO",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
