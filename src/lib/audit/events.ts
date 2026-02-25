import { createSupabaseServerClient } from '@/lib/supabase/server';

type AuditPayload = {
  workspaceId: string;
  actorUserId?: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  payload?: Record<string, unknown>;
};

export async function logAuditEvent(input: AuditPayload) {
  const supabase = await createSupabaseServerClient();
  await supabase.from('audit_events').insert({
    workspace_id: input.workspaceId,
    actor_user_id: input.actorUserId ?? null,
    action: input.action,
    object_type: input.objectType,
    object_id: input.objectId ?? null,
    payload: input.payload ?? {}
  });
}
