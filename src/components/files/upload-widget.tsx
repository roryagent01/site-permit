'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

type Props = {
  bucket: 'permit_attachments' | 'qualification_evidence';
  permitId?: string;
  contractorQualificationId?: string;
};

export function UploadWidget({ bucket, permitId, contractorQualificationId }: Props) {
  const [status, setStatus] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  return (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-xs text-slate-600">Upload evidence/attachment</p>
      <input
        type="file"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          setUploading(true);
          setStatus('Preparing upload...');

          try {
            const signRes = await fetch('/api/upload/sign', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bucket, fileName: file.name, sizeBytes: file.size })
            });

            if (!signRes.ok) {
              setStatus('Could not sign upload request.');
              return;
            }

            const sign = (await signRes.json()) as { token: string; path: string; bucket: string };
            const supabase = createSupabaseBrowserClient();

            setStatus('Uploading file...');
            const { error: uploadError } = await supabase.storage.from(sign.bucket).uploadToSignedUrl(sign.path, sign.token, file);

            if (uploadError) {
              setStatus(`Upload failed: ${uploadError.message}`);
              return;
            }

            setStatus('Registering file metadata...');
            const regRes = await fetch('/api/files/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                bucket,
                path: sign.path,
                sizeBytes: file.size,
                permitId,
                contractorQualificationId
              })
            });

            if (!regRes.ok) {
              setStatus('File uploaded but metadata registration failed.');
              return;
            }

            setStatus('Upload complete ✅');
          } finally {
            setUploading(false);
            e.currentTarget.value = '';
          }
        }}
        disabled={uploading}
        className="w-full text-sm"
      />
      {status ? <p className="mt-2 text-xs text-slate-600">{status}</p> : null}
    </div>
  );
}
