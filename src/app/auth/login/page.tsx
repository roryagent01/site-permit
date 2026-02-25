export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold text-blue-900">Sign in with email OTP</h1>
      <p className="text-sm text-slate-600">Authentication wiring to Supabase is part of PL-0.1.</p>
      <form className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-sm font-medium text-slate-700">Email</label>
        <input className="w-full rounded-md border border-slate-300 px-3 py-2" type="email" placeholder="you@company.com" />
        <button className="w-full rounded-md bg-blue-700 px-3 py-2 font-medium text-white" type="button">Send OTP</button>
      </form>
    </main>
  );
}
