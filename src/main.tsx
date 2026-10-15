import {createRoot} from 'react-dom/client';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Could not find the application root element.');
}

const root = createRoot(rootElement);
const missingSupabaseVariables = [
  !import.meta.env.VITE_SUPABASE_URL && 'VITE_SUPABASE_URL',
  !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && 'VITE_SUPABASE_PUBLISHABLE_KEY',
].filter((variable): variable is string => Boolean(variable));

if (missingSupabaseVariables.length > 0) {
  root.render(
    <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
      <section className="mx-auto max-w-2xl rounded-2xl border border-amber-500/30 bg-slate-900 p-8">
        <h1 className="text-xl font-bold">DelegateOS needs configuration</h1>
        <p className="mt-3 text-slate-300">
          Add these variables in Vercel under Project Settings → Environment Variables,
          then redeploy:
        </p>
        <ul className="mt-4 list-inside list-disc font-mono text-amber-200">
          {missingSupabaseVariables.map((variable) => <li key={variable}>{variable}</li>)}
        </ul>
      </section>
    </main>
  );
} else {
  void import('./App.tsx')
    .then(({ default: App }) => root.render(<App />))
    .catch((error: unknown) => {
      console.error('Failed to load DelegateOS.', error);
      root.render(
        <main className="min-h-screen bg-slate-950 px-6 py-16 text-slate-100">
          <section className="mx-auto max-w-2xl rounded-2xl border border-rose-500/30 bg-slate-900 p-8">
            <h1 className="text-xl font-bold">DelegateOS could not load</h1>
            <p className="mt-3 text-slate-300">
              Refresh the page. If this continues, check the browser console and Vercel
              deployment logs for the loading error.
            </p>
          </section>
        </main>
      );
    });
}
