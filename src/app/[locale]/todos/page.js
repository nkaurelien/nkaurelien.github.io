import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { setRequestLocale } from 'next-intl/server';

export default async function Page({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select();

  if (error) {
    console.error('Error fetching todos:', error);
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Todos ({locale})</h1>
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
      <ul>
        {todos?.map((todo) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </div>
  );
}
