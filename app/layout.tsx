import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yzhe Nails | Online Booking",
  description: "Book your nail appointment at Yzhe Nails.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
