import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FCFS - First Come First Serve Campaigns",
  description: "Web3 micro-bounty platform for social engagement",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-950 text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
