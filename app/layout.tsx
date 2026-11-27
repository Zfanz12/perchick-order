import type { Metadata } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PERCHICK – Perfectly Chicken | Pre-Order",
  description:
    "Cravin' something Tasty? Pesan PERCHICK – Paket Single, Double & Triple dengan Macaroni atau Fries, Chicken Crispy, serta saus Cheese, Garlic, atau Mushroom.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className={`${fredoka.variable} ${plusJakartaSans.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-perchick-cream text-perchick-charcoal font-sans selection:bg-perchick-yellow selection:text-perchick-red-dark">
        {children}
      </body>
    </html>
  );
}
