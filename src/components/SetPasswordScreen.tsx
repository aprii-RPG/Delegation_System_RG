import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Layers, Lock } from 'lucide-react';
import { useTasks } from '../context/TaskContext';

export const SetPasswordScreen: React.FC = () => {
  const { isAuthenticated, setPassword } = useTasks();
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    if (password.length < 8) {
      setErrorMessage('Choose a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await setPassword(password);
      setIsComplete(true);
      setPasswordValue('');
      setConfirmPassword('');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to set your password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-12 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white">
            <Layers className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-extrabold">Set your password</h1>
          <p className="mt-2 text-sm text-slate-400">
            Create a private password for your DelegateOS account. Your password is never sent by email.
          </p>
        </div>

        {errorMessage && (
          <div role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isComplete ? (
          <div className="space-y-4 text-center">
            <div role="status" className="flex items-center justify-center gap-2 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <span>Password set successfully. Sign in with your new password.</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500"
            >
              Return to sign in
            </button>
          </div>
        ) : !isAuthenticated ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-slate-300">
              This invitation link is invalid or expired. Ask your administrator to send a new invitation.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Return to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-semibold text-slate-300">
              New password
              <span className="relative mt-1.5 block">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPasswordValue(event.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </span>
            </label>
            <label className="block text-sm font-semibold text-slate-300">
              Confirm password
              <span className="relative mt-1.5 block">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-10 pr-3 text-sm text-white outline-none focus:border-indigo-500"
                />
              </span>
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Setting password…' : 'Set password securely'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
};
