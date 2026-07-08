import { setRequestLocale } from 'next-intl/server';
import ChatClient from './ChatClient';

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const isFr = locale === 'fr';
  return {
    title: isFr ? 'Discuter avec Aurélien — Assistant IA' : 'Chat with Aurélien — AI Assistant',
    description: isFr
      ? 'Posez vos questions à mon jumeau numérique alimenté par IA et RAG (Supabase).'
      : 'Ask questions to my AI & RAG powered digital twin.',
  };
}

export default async function ChatPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ChatClient locale={locale} />;
}
