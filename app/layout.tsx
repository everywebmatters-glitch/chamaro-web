import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "./components/auth/AuthProvider";
import CartDrawer from "./components/cart/CartDrawer";
import { StoreProvider } from "./components/store/StoreProvider";
import "./globals.css";

/* PP Telegraf (commercial license), self-hosted; the only font family used site-wide (see globals.css) */
const telegraf = localFont({
  variable: "--font-telegraf",
  src: [
    { path: "./fonts/telegraf/PPTelegraf-Ultralight.otf", weight: "200", style: "normal" },
    { path: "./fonts/telegraf/PPTelegraf-UltralightOblique.otf", weight: "200", style: "italic" },
    { path: "./fonts/telegraf/PPTelegraf-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/telegraf/PPTelegraf-RegularOblique.otf", weight: "400", style: "italic" },
    { path: "./fonts/telegraf/PPTelegraf-Ultrabold.otf", weight: "800", style: "normal" },
    { path: "./fonts/telegraf/PPTelegraf-UltraboldOblique.otf", weight: "800", style: "italic" },
  ],
});

export const metadata: Metadata = {
  title: "Chamaro | Engineered to Lead",
  description: "Premium office furniture for modern workspaces.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${telegraf.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <StoreProvider>
            {children}
            <CartDrawer />
          </StoreProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
