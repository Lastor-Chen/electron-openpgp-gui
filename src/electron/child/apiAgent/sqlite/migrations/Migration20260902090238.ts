import { Migration } from '@mikro-orm/migrations'

import { getAppId } from '../appIdUtils'

export class Migration20260902090238 extends Migration {
  override name = 'Migration20260902090238'

  override async up(): Promise<void> {
    this.addSql(
      `create table \`pgp_key\` (\`key_id\` text not null primary key, \`is_owner\` integer not null, \`name\` text null, \`email\` text null, \`encryption_key_id\` text not null, \`fingerprint\` text not null, \`creation_time\` date not null, \`expiration_time\` date null, \`public_key\` text not null, \`private_key\` text null, \`revocation_cert\` text null);`,
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
