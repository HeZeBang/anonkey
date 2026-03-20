/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Entity, Index, JoinColumn, Column, PrimaryColumn, ManyToOne } from 'typeorm';
import { id } from './util/id.js';
import { MiUser } from './User.js';

@Entity('note_anonymous_identity')
@Index(['userId', 'threadId'], { unique: true })
export class MiNoteAnonymousIdentity {
	@PrimaryColumn(id())
	public id: string;

	@Column({
		...id(),
		comment: 'The ID of the user.',
	})
	public userId: MiUser['id'];

	@ManyToOne(() => MiUser, {
		onDelete: 'CASCADE',
	})
	@JoinColumn()
	public user: MiUser | null;

	@Index('IDX_ANON_IDENTITY_THREAD')
	@Column('varchar', {
		length: 256,
	})
	public threadId: string;

	@Column('smallint')
	public anonymousIndex: number;

	constructor(data: Partial<MiNoteAnonymousIdentity>) {
		if (data == null) return;

		for (const [k, v] of Object.entries(data)) {
			(this as any)[k] = v;
		}
	}
}
