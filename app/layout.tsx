import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIP Healthcare — Patient Medical Record Management System",
  description:
    "Secure, role-enforced electronic health records platform for patients, authorized physicians, and healthcare administrators.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased notranslate" translate="no">
      <head>
        <meta name="google" content="notranslate" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 notranslate">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
