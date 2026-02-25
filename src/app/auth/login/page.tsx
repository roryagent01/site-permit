import { requestOtpAction } from '@/app/auth/actions';

const MESSAGES: Record<string, string> = {
  check_email: 'Check your email for your secure sign-in link.',
  missing_email: 'Enter an email address to continue.',
  otp_send_failed: 'Could not send sign-in email. Please try again.',
  missing_code: 'Sign-in link is incomplete. Request a new one.',
  callback_failed: 'Sign-in link expired or invalid. Request a new one.'
};

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const success = params.success ? MESSAGES[params.success] : null;
  const error = params.error ? MESSAGES[params.error] : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-blue-900">Sign in with email OTP</h1>
      <p className="text-sm text-slate-600">No password required. We send a secure one-time sign-in link.</p>

      {success ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p> : null}
      {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <form action={requestOtpAction} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          type="email"
          placeholder="you@company.com"
          required
        />
        <button className="w-full rounded-md bg-blue-700 px-3 py-2 font-medium text-white" type="submit">
          Send OTP
        </button>
      </form>
    </main>
  );
}
