/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as tree from 'weight-balanced-tree';
import {
  onConflictThrowError,
} from 'weight-balanced-tree/update';

import {
  isLinkTypeOrderableByUser,
} from '../../../../utility/isLinkTypeDirectionOrderable';
import type {
  RelationshipEditorStateT,
  RelationshipStateT,
  ReleaseRelationshipEditorStateT,
} from '../types';

import {
  cloneRelationshipState,
} from './cloneState';
import {
  getRelationshipsComparator,
} from './compareRelationships';
import {
  findLinkPhraseGroupInTargetTypeGroups,
  findTargetTypeGroups,
} from './findState';
import getRelationshipEditStatus from './getRelationshipEditStatus';
import isRelationshipBackward from './isRelationshipBackward';
import updateRelationships, {
  ADD_RELATIONSHIP,
  REMOVE_RELATIONSHIP,
} from './updateRelationships';

export default function moveRelationship(
  writableRootState:
    | {...RelationshipEditorStateT}
    | {...ReleaseRelationshipEditorStateT},
  relationship: RelationshipStateT,
  source: CoreEntityT,
  moveForward: boolean,
): void {
  const targetTypeGroups = findTargetTypeGroups(
    writableRootState.relationshipsBySource,
    source,
  );

  const linkPhraseGroup = findLinkPhraseGroupInTargetTypeGroups(
    targetTypeGroups,
    relationship,
    source,
  );

  invariant(
    linkPhraseGroup &&
    isLinkTypeOrderableByUser(
      relationship.linkTypeID,
      source,
      isRelationshipBackward(relationship, source),
    ),
  );

  const relationships = linkPhraseGroup.relationships;
  const findAdjacent = moveForward ? tree.findNext : tree.findPrev;
  const adjacentRelationshipNode = findAdjacent(
    relationships,
    relationship,
    getRelationshipsComparator(isRelationshipBackward(
      relationship,
      source,
    )),
  );

  if (!adjacentRelationshipNode) {
    return;
  }

  const adjacentRelationship = adjacentRelationshipNode.value;
  const nextLogicalLinkOrder =
    Math.max(0, relationship.linkOrder + (moveForward ? 1 : -1));
  const updates = [];

  const relationshipWithNewLinkOrder = (relationship, newLinkOrder) => {
    const newRelationship = cloneRelationshipState(relationship);
    newRelationship.linkOrder = newLinkOrder;
    newRelationship._status = getRelationshipEditStatus(
      newRelationship,
    );
    return newRelationship;
  };

  if (adjacentRelationship.linkOrder === nextLogicalLinkOrder) {
    updates.push(
      {
        relationship,
        throwIfNotExists: true,
        type: REMOVE_RELATIONSHIP,
      },
      {
        relationship: adjacentRelationship,
        throwIfNotExists: true,
        type: REMOVE_RELATIONSHIP,
      },
      {
        onConflict: onConflictThrowError,
        relationship: relationshipWithNewLinkOrder(
          relationship,
          adjacentRelationship.linkOrder,
        ),
        type: ADD_RELATIONSHIP,
      },
      {
        onConflict: onConflictThrowError,
        relationship: relationshipWithNewLinkOrder(
          adjacentRelationship,
          relationship.linkOrder,
        ),
        type: ADD_RELATIONSHIP,
      },
    );
  } else {
    updates.push(
      {
        relationship,
        throwIfNotExists: true,
        type: REMOVE_RELATIONSHIP,
      },
      {
        onConflict: onConflictThrowError,
        relationship: relationshipWithNewLinkOrder(
          relationship,
          nextLogicalLinkOrder,
        ),
        type: ADD_RELATIONSHIP,
      },
    );
  }

  updateRelationships(writableRootState, updates);
}
