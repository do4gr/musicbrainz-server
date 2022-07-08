/*
 * @flow strict
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import {uniqueId} from '../../common/utility/numbers';
import type {SeededRelationshipT} from '../types';

export default function getRelationshipStateId(
  relationship: RelationshipT | SeededRelationshipT | null,
): number {
  return (relationship?.id) ?? (-uniqueId());
}
