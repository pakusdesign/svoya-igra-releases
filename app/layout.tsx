import type { Metadata } from "next";
import { FluentRoot } from "@/components/FluentRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Своя игра",
  description: "Локальное приложение для проведения игры в формате Jeopardy",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/app-icon.png", type: "image/png", sizes: "1024x1024" }
    ],
    apple: "/app-icon.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <FluentRoot>{children}</FluentRoot>
      </body>
    </html>
  );
}
