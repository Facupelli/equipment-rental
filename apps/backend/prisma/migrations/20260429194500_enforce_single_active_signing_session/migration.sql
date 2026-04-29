WITH ranked_active_sessions AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_id, order_id, document_type
      ORDER BY created_at DESC, id DESC
    ) AS active_rank
  FROM signing_sessions
  WHERE status IN ('PENDING', 'OPENED')
)
UPDATE signing_sessions AS sessions
SET
  status = 'VOIDED',
  updated_at = NOW()
FROM ranked_active_sessions AS ranked
WHERE sessions.id = ranked.id
  AND ranked.active_rank > 1;

CREATE UNIQUE INDEX "signing_sessions_single_active_order_document_type_key"
ON "signing_sessions" ("tenant_id", "order_id", "document_type")
WHERE "status" IN ('PENDING', 'OPENED');
