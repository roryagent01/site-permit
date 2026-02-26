import { Resend } from 'resend';

type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
};

export async function sendEmail(input: SendEmailInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { ok: false, error: 'email_not_configured' };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data?.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown_email_error' };
  }
}

export async function sendEmailWithRetry(
  input: SendEmailInput,
  options: { maxAttempts?: number; baseDelayMs?: number } = {}
): Promise<{ ok: boolean; id?: string; error?: string; attempts: number }> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const baseDelayMs = Math.max(50, options.baseDelayMs ?? 250);

  let last: { ok: boolean; id?: string; error?: string } = { ok: false, error: 'unknown' };
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await sendEmail(input);
    if (last.ok) return { ...last, attempts: attempt };
    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, baseDelayMs * attempt));
    }
  }

  return { ...last, attempts: maxAttempts };
}

export function permitSubmittedEmailHtml(args: {
  permitTitle: string;
  workspaceName: string;
  permitId: string;
  appBaseUrl?: string;
}) {
  const link = `${args.appBaseUrl ?? ''}/app/permits/${args.permitId}`;
  return `
    <h2>Permit submitted for approval</h2>
    <p><strong>${args.permitTitle}</strong> was submitted in ${args.workspaceName}.</p>
    <p><a href="${link}">Open permit</a></p>
  `;
}

export function permitDecisionEmailHtml(args: {
  permitTitle: string;
  decision: string;
  comment?: string;
  permitId: string;
  appBaseUrl?: string;
}) {
  const link = `${args.appBaseUrl ?? ''}/app/permits/${args.permitId}`;
  return `
    <h2>Permit decision: ${args.decision}</h2>
    <p><strong>${args.permitTitle}</strong> has a new decision.</p>
    <p>Comment: ${args.comment ?? '-'}</p>
    <p><a href="${link}">Open permit</a></p>
  `;
}

export function reminderDigestEmailHtml(args: {
  workspaceName: string;
  expiringCount: number;
  mode: 'full' | 'summary';
  appBaseUrl?: string;
}) {
  const intro =
    args.mode === 'summary'
      ? `You have ${args.expiringCount} expiring qualification records. This is a summary-only digest due to delivery caps.`
      : `You have ${args.expiringCount} expiring qualification records in the configured reminder window.`;
  return `
    <h2>Qualification expiry digest</h2>
    <p>${intro}</p>
    <p>Workspace: ${args.workspaceName}</p>
    <p><a href="${args.appBaseUrl ?? ''}/app/reminders">Open reminders</a></p>
  `;
}
