import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Project 72 — Health & Weight Loss OS",
  description: "Personal health, fitness, habit, nutrition, and weight-loss tracker for target 72kg.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-full flex flex-col bg-[#0f1117] text-white selection:bg-teal-500/30 selection:text-white">
        <QueryProvider>
          <ThemeProvider defaultTheme="dark">
            <AppShell>
              {children}
            </AppShell>
            <Toaster position="bottom-right" theme="dark" closeButton richColors />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
