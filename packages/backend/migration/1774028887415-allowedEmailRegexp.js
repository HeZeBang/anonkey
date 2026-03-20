/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AllowedEmailRegexp1774028887415 {
    name = 'AllowedEmailRegexp1774028887415'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "allowedEmailRegexp" character varying(1024) NOT NULL DEFAULT ''`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "allowedEmailRegexp"`);
    }
}
