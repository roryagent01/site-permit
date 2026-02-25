-- Demo seed for pilot evaluation
-- Run against a dev workspace after creating users/memberships

-- Example template with 2-step approval (approver -> admin)
insert into permit_templates (workspace_id, name, category, definition)
values
  (
    :'workspace_id',
    'Hot Work Standard',
    'Hot Work',
    jsonb_build_object(
      'requiredFields', jsonb_build_array('location','start_at','end_at'),
      'qualificationGate', jsonb_build_object('mode','warn','requiredQualificationTypeIds', jsonb_build_array())
    )
  )
returning id;

-- Add approval steps separately after capture in client/sql tool
