import { defineEntity, p } from '@mikro-orm/core'
import type { InferEntity } from '@mikro-orm/core'

export const PgpKeySchema = defineEntity({
  name: 'PgpKey',
  tableName: 'pgp_key',
  properties: {
    key_id: p.text().primary(),
    is_owner: p.boolean(),
    name: p.text().nullable(),
    email: p.text().nullable(),
    encryption_key_id: p.text().unique(),
    fingerprint: p.text().unique(),
    created: p.date(), // 不是 row 的 timestamp
    expires: p.date().nullable(), // 不是 row 的 timestamp
    public_key: p.text(),
    private_key: p.text().nullable(),
    revocation_cert: p.text().nullable(),
  },
})

export type PgpKeyEntity = InferEntity<typeof PgpKeySchema>
