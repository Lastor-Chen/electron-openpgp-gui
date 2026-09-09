import { Migration } from '@mikro-orm/migrations'

import { getAppId } from '../appIdUtils.ts'

export class Migration20260909082118 extends Migration {
  override name = 'Migration20260909082118'

  override async up(): Promise<void> {
    this.addSql(
      `create table \`pgp_key\` (\`key_id\` text not null primary key, \`is_owner\` integer not null, \`name\` text null, \`email\` text null, \`encryption_key_id\` text not null, \`fingerprint\` text not null, \`created\` date not null, \`expires\` date null, \`public_key\` text not null, \`private_key\` text null, \`revocation_cert\` text null);`,
    )
    this.addSql(
      `create unique index \`pgp_key_encryption_key_id_unique\` on \`pgp_key\` (\`encryption_key_id\`);`,
    )
    this.addSql(
      `create unique index \`pgp_key_fingerprint_unique\` on \`pgp_key\` (\`fingerprint\`);`,
    )

    // assign app id
    await this.execute(`PRAGMA application_id = ?;`, [getAppId()])
  }
}
