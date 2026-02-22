import type { Metadata } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NewYearWrapper } from "@/components/celebration/NewYearWrapper";
import { MessageReminder } from "@/components/messages/message-reminder";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Allianz Marseille - SaaS Agence",
  description: "Gestion complète de votre agence : actes commerciaux, commissions et indicateurs",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Script
          id="theme-session-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){if(!sessionStorage.getItem("theme")){try{localStorage.removeItem("theme");}catch(e){}}})();`,
          }}
        />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <NewYearWrapper>
            {children}
          </NewYearWrapper>
          <Toaster />
          {/* MessageReminder désactivé - cause React error #310 */}
          {/* <MessageReminder /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}
