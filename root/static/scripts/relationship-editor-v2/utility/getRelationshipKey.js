/*
 * @flow strict
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import type {RelationshipStateT} from '../types';

export default function getRelationshipKey(
  relationship: RelationshipStateT,
): string {
  return (
    relationship.entity0.entityType + '-' +
    relationship.entity1.entityType + '-' +
    String(relationship.id)
  );
}
