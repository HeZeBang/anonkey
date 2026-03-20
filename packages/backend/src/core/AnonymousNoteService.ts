/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { NoteAnonymousIdentitiesRepository } from '@/models/_.js';
import type { MiUser, MiLocalUser } from '@/models/User.js';
import { IdService } from '@/core/IdService.js';
import { SystemAccountService } from '@/core/SystemAccountService.js';
import { RoleService } from '@/core/RoleService.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class AnonymousNoteService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.noteAnonymousIdentitiesRepository)
		private noteAnonymousIdentitiesRepository: NoteAnonymousIdentitiesRepository,

		private idService: IdService,
		private systemAccountService: SystemAccountService,
		private roleService: RoleService,
	) {
	}

	@bindThis
	public async getOrAssignThreadIdentity(userId: MiUser['id'], threadId: string): Promise<{ anonymousIndex: number }> {
		// Atomic upsert: INSERT ... ON CONFLICT DO NOTHING + parameterized subquery for index
		const id = this.idService.gen();

		await this.db.query(
			`INSERT INTO "note_anonymous_identity" ("id", "userId", "threadId", "anonymousIndex")
			 VALUES ($1, $2, $3::varchar(256), COALESCE((SELECT MAX("anonymousIndex") + 1 FROM "note_anonymous_identity" WHERE "threadId" = $3::varchar(256)), 0))
			 ON CONFLICT ("userId", "threadId") DO NOTHING`,
			[id, userId, threadId],
		);

		// Always fetch the definitive record (whether just inserted or pre-existing)
		const record = await this.noteAnonymousIdentitiesRepository.findOneByOrFail({
			userId,
			threadId,
		});

		return { anonymousIndex: record.anonymousIndex };
	}

	@bindThis
	public async getAnonymousUser(): Promise<MiLocalUser> {
		return await this.systemAccountService.fetch('anonymous');
	}

	@bindThis
	public async isViewerPrivileged(noteUserId: MiUser['id'], viewerId: MiUser['id'] | null): Promise<boolean> {
		if (viewerId == null) return false;
		// Author can see their own anonymous posts
		if (viewerId === noteUserId) return true;
		// Admins can see anonymous posts
		return await this.roleService.isAdministrator({ id: viewerId });
	}
}
