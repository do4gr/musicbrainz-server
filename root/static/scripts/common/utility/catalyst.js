/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import {createCoreEntityObject} from '../entity2';

export function getCatalystContext(): SanitizedCatalystContextT {
  const $c = window[GLOBAL_JS_NAMESPACE]?.$c;
  invariant($c, 'Catalyst context not found in GLOBAL_JS_NAMESPACE');
  return $c;
}

export function getSourceEntityData():
    | CoreEntityT
    | {+entityType: CoreEntityTypeT, +isNewEntity: true}
    | null {
  const $c = getCatalystContext();
  return $c.stash.source_entity ?? null;
}

export function getSourceEntityDataForRelationshipEditor(): CoreEntityT {
  let source = getSourceEntityData();
  invariant(
    source,
    'Source entity data not found in global Catalyst stash',
  );
  if (source.isNewEntity) {
    source = createCoreEntityObject(source.entityType);
  }
  return source;
}
