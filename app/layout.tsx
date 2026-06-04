import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SidebarWrapper from "./components/SidebarWrapper";
import SuppressConsole from './components/SuppressConsole';
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";

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
      <body suppressHydrationWarning className="min-h-full ">
        <SuppressConsole />
<AuthProvider>
  <div className="grid h-screen grid-rows-[72px_1fr]">

    <Navbar />

    <div className="flex overflow-hidden">
      <SidebarWrapper />

      <main className="flex-1 overflow-auto bg-[#F4F4F5]">
        {children}
      </main>
    </div>

  </div>
</AuthProvider>
      </body>
    </html>
  );
}
