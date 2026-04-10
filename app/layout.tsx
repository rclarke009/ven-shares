import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VenShares | Where Ideas Meet Action",
  description: "Inventors + Skilled Professionals = Thriving Businesses",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-[#F8FAFC] text-slate-900`}>
          {/* Hero background will be added per page */}
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}