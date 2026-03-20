/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AnonymousNotes1774017154176 {
    name = 'AnonymousNotes1774017154176'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "isAnonymous" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TABLE "note_anonymous_identity" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "threadId" character varying(256) NOT NULL, "anonymousIndex" smallint NOT NULL, CONSTRAINT "PK_note_anonymous_identity" PRIMARY KEY ("id"))`);
        await queryRunner.query(`COMMENT ON COLUMN "note_anonymous_identity"."userId" IS 'The ID of the user.'`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9f5300128b3f29ae23c50274dd" ON "note_anonymous_identity" ("userId", "threadId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ANON_IDENTITY_THREAD" ON "note_anonymous_identity" ("threadId")`);
        await queryRunner.query(`ALTER TABLE "note_anonymous_identity" ADD CONSTRAINT "FK_880eaa8d12ee2c7fa0046f2d681" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_anonymous_identity" DROP CONSTRAINT "FK_880eaa8d12ee2c7fa0046f2d681"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ANON_IDENTITY_THREAD"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9f5300128b3f29ae23c50274dd"`);
        await queryRunner.query(`DROP TABLE "note_anonymous_identity"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isAnonymous"`);
    }
}
