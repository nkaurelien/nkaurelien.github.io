import { setRequestLocale } from 'next-intl/server';
import { getSection } from '@/lib/content';
import ContactSection from '@/components/sections/ContactSection';

export default async function ContactPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const contact = await getSection(locale, 'contact');
  return <ContactSection contact={contact} />;
}
