// Placeholder entry point. The original app source (src/) was not included in
// the repository; replace this folder with the real src/ from AI Studio.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

function App() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6 font-sans">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-lg shadow-rose-500/30" />
        <h1 className="font-display text-4xl font-extrabold tracking-tight">Kora</h1>
        <p className="mt-3 text-[#A6A9B4]">
          Live video meetups, chat and more are on the way. Check back soon.
        </p>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
