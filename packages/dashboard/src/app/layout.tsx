import { Inter, JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: "AIRails",
  description: "AI governance for engineering teams",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable}`}>
      <body className="font-sans">
          <QueryProvider>{children}</QueryProvider>
        </body>
    </html>
  );
}
