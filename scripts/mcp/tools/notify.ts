import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface ContactMessageParams {
  senderName: string;
  senderEmail: string;
  subject?: string;
  message: string;
}

export async function sendContactMessage(params: ContactMessageParams): Promise<{ success: boolean; message: string }> {
  const ntfyServer = (process.env.NTFY_SERVER_URL || process.env.NTFY_BASE_URL || 'https://ntfy.kamitbrains.fr').replace(/\/+$/, '');
  const topic = process.env.NTFY_TOPIC;

  if (!topic) {
    throw new Error('NTFY_TOPIC non configuré dans l\'environnement.');
  }

  const endpoint = `${ntfyServer}/${topic.replace(/^\/+/, '')}`;
  const subject = params.subject || 'Nouveau message de contact via Portfolio MCP';

  const bodyContent = [
    `👤 De : ${params.senderName} (${params.senderEmail})`,
    `📌 Sujet : ${subject}`,
    `\n💬 Message :\n${params.message}`,
  ].join('\n');

  const headers: Record<string, string> = {
    'Title': `📬 Contact Portfolio: ${params.senderName}`,
    'Priority': 'high',
    'Tags': 'mailbox_with_mail,speech_balloon',
    'Content-Type': 'text/plain; charset=utf-8',
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: bodyContent,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Échec envoi notification contact (${res.status} ${res.statusText}): ${errText}`);
  }

  return {
    success: true,
    message: `Votre message a été transmis avec succès à Aurélien Nkumbe !`,
  };
}
