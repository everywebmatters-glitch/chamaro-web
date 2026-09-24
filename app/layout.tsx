import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import CartDrawer from "./components/cart/CartDrawer";
import { StoreProvider } from "./components/store/StoreProvider";
import "./globals.css";

/* Poppins matches the typography on the product banners */
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Chamaro | Engineered to Lead",
  description: "Premium office furniture for modern workspaces.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          {children}
          <CartDrawer />
        </StoreProvider>
      </body>
    </html>
  );
}
