/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import areDatePeriodsEqual from '../../../../utility/areDatePeriodsEqual';
import type {
  RelationshipStateT,
} from '../types';

import relationshipsHaveSamePhraseGroup
  from './relationshipsHaveSamePhraseGroup';

export default function relationshipsAreDuplicates(
  relationship1: RelationshipStateT,
  relationship2: RelationshipStateT,
): boolean {
  return (
    relationship1.linkOrder === relationship2.linkOrder &&
    relationshipsHaveSamePhraseGroup(relationship1, relationship2) &&
    areDatePeriodsEqual(relationship1, relationship2)
  );
}
