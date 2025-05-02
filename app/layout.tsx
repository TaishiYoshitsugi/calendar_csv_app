import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { M_PLUS_1p } from 'next/font/google'

const mPlus1p = M_PLUS_1p({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: "カレンダーCSVアプリ",
  description: "CSVファイルからカレンダーを表示するアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&family=M+PLUS+1p:wght@400;500;700&family=Kosugi+Maru&family=Sawarabi+Gothic&family=Yusei+Magic&family=Zen+Maru+Gothic&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={mPlus1p.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
