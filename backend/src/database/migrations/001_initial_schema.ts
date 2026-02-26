import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      CREATE TYPE gender_enum AS ENUM ('man', 'woman', 'non_binary', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE dating_intent_enum AS ENUM ('serious', 'casual', 'both')
    `);
    await queryRunner.query(`
      CREATE TYPE discovery_action_enum AS ENUM ('interested', 'pass')
    `);
    await queryRunner.query(`
      CREATE TYPE match_status_enum AS ENUM ('active', 'ended')
    `);
    await queryRunner.query(`
      CREATE TYPE report_reason_enum AS ENUM ('spam', 'fake_profile', 'harassment', 'inappropriate_content', 'other')
    `);
    await queryRunner.query(`
      CREATE TYPE verification_status_enum AS ENUM ('pending', 'verified', 'rejected')
    `);

    // users
    await queryRunner.query(`
      CREATE TABLE users (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email                 VARCHAR(320) NOT NULL,
        phone                 VARCHAR(30),
        password_hash         VARCHAR(255) NOT NULL,
        is_email_verified     BOOLEAN NOT NULL DEFAULT FALSE,
        is_phone_verified     BOOLEAN NOT NULL DEFAULT FALSE,
        display_name          VARCHAR(60),
        birth_date            DATE,
        gender                gender_enum,
        seeking_genders       gender_enum[] NOT NULL DEFAULT '{}',
        dating_intent         dating_intent_enum,
        bio                   VARCHAR(500),
        location_city         VARCHAR(100),
        location_lat          DECIMAL(9,6),
        location_lng          DECIMAL(9,6),
        voice_intro_url       TEXT,
        voice_intro_duration  SMALLINT,
        visibility_score      DECIMAL(5,2) NOT NULL DEFAULT 0,
        profile_completeness  DECIMAL(5,2) NOT NULL DEFAULT 0,
        gdpr_consent_at       TIMESTAMPTZ NOT NULL,
        gdpr_consent_version  VARCHAR(10) NOT NULL DEFAULT '1.0',
        marketing_consent     BOOLEAN NOT NULL DEFAULT FALSE,
        is_active             BOOLEAN NOT NULL DEFAULT TRUE,
        is_banned             BOOLEAN NOT NULL DEFAULT FALSE,
        banned_at             TIMESTAMPTZ,
        banned_reason         TEXT,
        last_active_at        TIMESTAMPTZ,
        data_deletion_requested BOOLEAN NOT NULL DEFAULT FALSE,
        data_deletion_at      TIMESTAMPTZ,
        role                  VARCHAR(20) NOT NULL DEFAULT 'user',
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT users_email_unique UNIQUE (email)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_users_email ON users(email)`);
    await queryRunner.query(`CREATE INDEX idx_users_visibility ON users(visibility_score DESC) WHERE is_active = TRUE AND is_banned = FALSE`);
    await queryRunner.query(`CREATE INDEX idx_users_gender ON users(gender)`);
    await queryRunner.query(`CREATE INDEX idx_users_intent ON users(dating_intent)`);
    await queryRunner.query(`CREATE INDEX idx_users_birth ON users(birth_date)`);

    // refresh_tokens
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash  TEXT NOT NULL,
        device_info TEXT,
        expires_at  TIMESTAMPTZ NOT NULL,
        revoked     BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT refresh_tokens_hash_unique UNIQUE (token_hash)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_refresh_user ON refresh_tokens(user_id)`);

    // user_photos
    await queryRunner.query(`
      CREATE TABLE user_photos (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        cloudinary_id    TEXT NOT NULL,
        is_primary       BOOLEAN NOT NULL DEFAULT FALSE,
        display_order    SMALLINT NOT NULL DEFAULT 0,
        uploaded_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_photos_user ON user_photos(user_id)`);
    await queryRunner.query(`CREATE UNIQUE INDEX idx_photos_primary ON user_photos(user_id) WHERE is_primary = TRUE`);

    // photo_verifications
    await queryRunner.query(`
      CREATE TABLE photo_verifications (
        id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status           verification_status_enum NOT NULL DEFAULT 'pending',
        verified_at      TIMESTAMPTZ,
        rejection_reason VARCHAR(255),
        created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_verif_user ON photo_verifications(user_id)`);

    // interests
    await queryRunner.query(`
      CREATE TABLE interests (
        id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name     VARCHAR(60) NOT NULL,
        category VARCHAR(40),
        CONSTRAINT interests_name_unique UNIQUE (name)
      )
    `);

    // user_interests
    await queryRunner.query(`
      CREATE TABLE user_interests (
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        interest_id UUID NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, interest_id)
      )
    `);

    // discovery_queue
    await queryRunner.query(`
      CREATE TABLE discovery_queue (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        viewer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        target_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action      discovery_action_enum,
        rank_score  DECIMAL(6,2) NOT NULL DEFAULT 0,
        queue_date  DATE NOT NULL,
        acted_at    TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT discovery_queue_unique UNIQUE (viewer_id, target_id, queue_date)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_dq_viewer_date ON discovery_queue(viewer_id, queue_date, action)`);

    // matches
    await queryRunner.query(`
      CREATE TABLE matches (
        id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user1_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        user2_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status                match_status_enum NOT NULL DEFAULT 'active',
        stream_channel_id     TEXT,
        message_count         INT NOT NULL DEFAULT 0,
        voice_calls_unlocked  BOOLEAN NOT NULL DEFAULT FALSE,
        voice_calls_unlocked_at TIMESTAMPTZ,
        user1_reveal_consent  BOOLEAN NOT NULL DEFAULT FALSE,
        user2_reveal_consent  BOOLEAN NOT NULL DEFAULT FALSE,
        photos_revealed       BOOLEAN NOT NULL DEFAULT FALSE,
        revealed_at           TIMESTAMPTZ,
        ended_at              TIMESTAMPTZ,
        ended_by              UUID REFERENCES users(id),
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT matches_pair_unique UNIQUE (user1_id, user2_id),
        CHECK (user1_id < user2_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_matches_user1 ON matches(user1_id)`);
    await queryRunner.query(`CREATE INDEX idx_matches_user2 ON matches(user2_id)`);
    await queryRunner.query(`CREATE INDEX idx_matches_active ON matches(user1_id, user2_id) WHERE status = 'active'`);

    // voice_call_sessions
    await queryRunner.query(`
      CREATE TABLE voice_call_sessions (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id       UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
        agora_channel  TEXT NOT NULL,
        initiator_id   UUID NOT NULL REFERENCES users(id),
        started_at     TIMESTAMPTZ,
        ended_at       TIMESTAMPTZ,
        duration_s     INT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_vcs_match ON voice_call_sessions(match_id)`);

    // blocks
    await queryRunner.query(`
      CREATE TABLE blocks (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT blocks_unique UNIQUE (blocker_id, blocked_id)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_blocks_blocker ON blocks(blocker_id)`);
    await queryRunner.query(`CREATE INDEX idx_blocks_blocked ON blocks(blocked_id)`);

    // reports
    await queryRunner.query(`
      CREATE TABLE reports (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reporter_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reported_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason       report_reason_enum NOT NULL,
        details      TEXT,
        is_reviewed  BOOLEAN NOT NULL DEFAULT FALSE,
        reviewed_at  TIMESTAMPTZ,
        reviewed_by  UUID,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_reports_reported ON reports(reported_id)`);
    await queryRunner.query(`CREATE INDEX idx_reports_pending ON reports(is_reviewed) WHERE is_reviewed = FALSE`);

    // visibility_score_log
    await queryRunner.query(`
      CREATE TABLE visibility_score_log (
        id         BIGSERIAL PRIMARY KEY,
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        old_score  DECIMAL(5,2),
        new_score  DECIMAL(5,2) NOT NULL,
        reason     VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_score_log_user ON visibility_score_log(user_id, created_at DESC)`);

    // notification_tokens
    await queryRunner.query(`
      CREATE TABLE notification_tokens (
        id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expo_token TEXT NOT NULL,
        device_id  TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT notif_tokens_unique UNIQUE (user_id, expo_token)
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_notif_tokens_user ON notification_tokens(user_id)`);

    // gdpr_requests
    await queryRunner.query(`
      CREATE TABLE gdpr_requests (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
        user_email    VARCHAR(320) NOT NULL,
        request_type  VARCHAR(30) NOT NULL,
        status        VARCHAR(20) NOT NULL DEFAULT 'pending',
        requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        completed_at  TIMESTAMPTZ,
        notes         TEXT
      )
    `);
    await queryRunner.query(`CREATE INDEX idx_gdpr_pending ON gdpr_requests(status) WHERE status = 'pending'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS gdpr_requests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS notification_tokens CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS visibility_score_log CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS reports CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS blocks CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS voice_call_sessions CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS matches CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS discovery_queue CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_interests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS interests CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS photo_verifications CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_photos CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS users CASCADE`);
    await queryRunner.query(`DROP TYPE IF EXISTS verification_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS report_reason_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS match_status_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS discovery_action_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS dating_intent_enum`);
    await queryRunner.query(`DROP TYPE IF EXISTS gender_enum`);
  }
}
