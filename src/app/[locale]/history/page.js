import { setRequestLocale } from 'next-intl/server';
import { Container, Title } from '@mantine/core';
import { getApp, getSection } from '@/lib/content';
import HistoryTimeline from '@/components/sections/HistoryTimeline';

export default async function HistoryPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [app, history] = await Promise.all([getApp(locale), getSection(locale, 'history')]);
  const title = app?.metadatas?.titles?.history || 'Historique';

  return (
    <>
      <Container size="lg" pt={48}>
        <Title order={1} ta="center">
          {title}
        </Title>
      </Container>
      <HistoryTimeline history={history} locale={locale} />
    </>
  );
}
