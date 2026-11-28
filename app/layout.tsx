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

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://perchickin.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "PERCHICK – Perfectly Chicken | Pre-Order",
  description:
    "Cravin' something Tasty? Pesan PERCHICK – Paket Single, Double & Triple dengan Macaroni atau Fries, Chicken Crispy, serta saus Cheese, Garlic, atau Mushroom.",
  openGraph: {
    title: "PERCHICK – Perfectly Chicken | Pre-Order",
    description:
      "Rasakan PERCHICKan Nikmatnya! Pesan Paket Single, Double & Triple dengan Macaroni atau Fries, Chicken Crispy, serta saus Cheese, Garlic, atau Mushroom.",
    url: SITE_URL,
    siteName: "PERCHICK",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PERCHICK – Perfectly Chicken | Rasakan PERCHICKan Nikmatnya",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PERCHICK – Perfectly Chicken | Pre-Order",
    description:
      "Rasakan PERCHICKan Nikmatnya! Pre-Order Paket Single, Double & Triple.",
    images: ["/og-image.png"],
  },
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
