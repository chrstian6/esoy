import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";
import Footer from "@/components/Footer";
export const metadata: Metadata = {
  title: "GLN Photos",
  description: "GLN Photos by Gleen Photography",
  icons: {
    icon: [{ url: "/images/logo.png?v=1", type: "image/png", sizes: "32x32" }],
    shortcut: "/images/logo.png?v=1",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="antialiased"
        style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
      >
        {children}
        <Toaster position="top-center" richColors expand={true} closeButton />
        <Footer />
      </body>
    </html>
  );
}
