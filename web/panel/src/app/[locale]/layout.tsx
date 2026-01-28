import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getMessages, setRequestLocale } from "next-intl/server";
// @ts-ignore
import "@/styles/global.css";
import { ThemeProvider } from "@/components/Providers/ThemeProvider";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import qk from "@/lib/fetches/keys";
import { Session } from "@/types/Session";
import { apiFetchServer } from "@/lib/apiFetchServer";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  const qc = new QueryClient();

  await qc.fetchQuery({
    queryKey: qk.api.v1.user.session(),
    queryFn: async () => {
      try {
        const d = await apiFetchServer("/api/v1/user/session");
        if (!d.ok) return null;
        const da = (await d.json()).user as Session;
        return da;
      } catch (e) {
        return null;
      }
    },
  });

  return (
    <>
      <html lang={locale} suppressHydrationWarning>
        <body>
          <NextIntlClientProvider
            messages={messages}
            locale={locale}
            key={locale}
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
              <main id="root" lang={locale}>
                <HydrationBoundary state={dehydrate(qc)}>
                  {children}
                </HydrationBoundary>
              </main>
            </ThemeProvider>
          </NextIntlClientProvider>
        </body>
      </html>
    </>
  );
}
