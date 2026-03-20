/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AnonymousNotes1769000000000 {
    name = 'AnonymousNotes1769000000000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "isAnonymous" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE TABLE "note_anonymous_identity" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "threadId" character varying(256) NOT NULL, "anonymousIndex" smallint NOT NULL, CONSTRAINT "PK_note_anonymous_identity" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ANON_IDENTITY_USER_THREAD" ON "note_anonymous_identity" ("userId", "threadId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ANON_IDENTITY_THREAD" ON "note_anonymous_identity" ("threadId")`);
        await queryRunner.query(`ALTER TABLE "note_anonymous_identity" ADD CONSTRAINT "FK_note_anonymous_identity_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_anonymous_identity" DROP CONSTRAINT "FK_note_anonymous_identity_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ANON_IDENTITY_THREAD"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ANON_IDENTITY_USER_THREAD"`);
        await queryRunner.query(`DROP TABLE "note_anonymous_identity"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isAnonymous"`);
    }
}
