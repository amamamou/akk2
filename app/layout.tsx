import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// SidebarWrapper moved into LayoutShell
import SuppressConsole from './components/SuppressConsole';
import { AuthProvider } from "./context/AuthContext";
import LayoutShell from "./components/LayoutShell";
import ThemeProvider from "./components/ThemeProvider";
import QueryProvider from "./components/QueryProvider";

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
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('akou.theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;if(d){r.classList.add('dark');}else{r.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning className="min-h-full bg-background text-foreground">
        <SuppressConsole />
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <LayoutShell>{children}</LayoutShell>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
