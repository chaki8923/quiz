import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QuizLive - リアルタイムクイズアプリ",
  description: "複数人でリアルタイムに挑戦できるクイズアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  );
}
