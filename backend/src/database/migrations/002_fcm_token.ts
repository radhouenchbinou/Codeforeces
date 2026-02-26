import { MigrationInterface, QueryRunner } from 'typeorm';

export class FcmToken1700000000002 implements MigrationInterface {
  name = 'FcmToken1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old unique constraint that referenced expo_token
    await queryRunner.query(`ALTER TABLE notification_tokens DROP CONSTRAINT IF EXISTS notif_tokens_unique`);

    // Rename column
    await queryRunner.query(`ALTER TABLE notification_tokens RENAME COLUMN expo_token TO fcm_token`);

    // Re-create unique constraint on the new column name
    await queryRunner.query(
      `ALTER TABLE notification_tokens ADD CONSTRAINT notif_tokens_unique UNIQUE (user_id, fcm_token)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE notification_tokens DROP CONSTRAINT IF EXISTS notif_tokens_unique`);
    await queryRunner.query(`ALTER TABLE notification_tokens RENAME COLUMN fcm_token TO expo_token`);
    await queryRunner.query(
      `ALTER TABLE notification_tokens ADD CONSTRAINT notif_tokens_unique UNIQUE (user_id, expo_token)`,
    );
  }
}
