import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "./components/SidebarWrapper";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Akoustic Arts",
    template: "%s | Akoustic Arts",
  },
  description:
    "Control and schedule audio experiences across your spaces with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full">
        <AuthProvider>
          <div className="flex h-screen bg-white text-gray-900 font-sans overflow-hidden">
            <SidebarWrapper />
            <main className="flex-1 min-w-0 bg-white  border-gray-200 shadow-sm flex flex-col">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
