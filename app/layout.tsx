import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitScape",
  description: "Transform your code story into visual glory",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <link rel="icon" href="/favicon.svg" sizes="any" />
      <body>
        {children}
      </body>
    </html>
  );
}
