/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as tree from 'weight-balanced-tree';

import {compare} from '../../common/i18n';
import {compareStrings} from '../../common/utility/compare';
import type {
  RelationshipLinkTypeGroupKeyT,
  RelationshipLinkTypeGroupsT,
  RelationshipLinkTypeGroupT,
  RelationshipPhraseGroupT,
  RelationshipSourceGroupsT,
  RelationshipStateT,
  RelationshipTargetTypeGroupsT,
  RelationshipTargetTypeGroupT,
} from '../types';

import {compareSourceWithSourceGroup} from './comparators';
import {getRelationshipsComparator} from './compareRelationships';
import getLinkPhrase from './getLinkPhrase';
import isRelationshipBackward from './isRelationshipBackward';

export function compareTargetTypeWithGroup(
  targetType: CoreEntityTypeT,
  targetTypeGroup: RelationshipTargetTypeGroupT,
): number {
  return compareStrings(targetType, targetTypeGroup[0]);
}

export function compareLinkTypeGroupKeyWithGroup(
  key: RelationshipLinkTypeGroupKeyT,
  group: RelationshipLinkTypeGroupT,
): number {
  return (
    (key.typeId - group.typeId) ||
    (key.backward ? 1 : 0) - (group.backward ? 1 : 0)
  );
}

function compareLinkPhraseWithGroup(
  linkPhrase: string,
  linkPhraseGroup: RelationshipPhraseGroupT,
): number {
  return compare(linkPhrase, linkPhraseGroup.textPhrase);
}

export function findTargetTypeGroups(
  sourceGroups: RelationshipSourceGroupsT,
  source: CoreEntityT,
): RelationshipTargetTypeGroupsT | null {
  const sourceGroupNode = tree.find(
    sourceGroups,
    source,
    compareSourceWithSourceGroup,
  );
  let targetTypeGroups = null;
  if (sourceGroupNode) {
    [/* source */, targetTypeGroups] =
      sourceGroupNode.value;
  }
  return targetTypeGroups;
}

export function findLinkTypeGroups(
  targetTypeGroups: RelationshipTargetTypeGroupsT,
  source: CoreEntityT,
  targetType: CoreEntityTypeT,
): RelationshipLinkTypeGroupsT | null {
  const targetTypeGroupNode = tree.find(
    targetTypeGroups,
    targetType,
    compareTargetTypeWithGroup,
  );
  if (targetTypeGroupNode === null) {
    return null;
  }
  const [/* targetType */, linkTypeGroups] =
    targetTypeGroupNode.value;
  return linkTypeGroups;
}

export function findLinkTypeGroup(
  linkTypeGroups: RelationshipLinkTypeGroupsT,
  linkTypeId: number,
  backward: boolean,
): RelationshipLinkTypeGroupT | null {
  const linkTypeGroupNode = tree.find(
    linkTypeGroups,
    {backward, typeId: linkTypeId},
    compareLinkTypeGroupKeyWithGroup,
  );
  if (linkTypeGroupNode === null) {
    return null;
  }
  return linkTypeGroupNode.value;
}

export function findLinkPhraseGroup(
  linkTypeGroup: RelationshipLinkTypeGroupT,
  relationshipState: RelationshipStateT,
): RelationshipPhraseGroupT | null {
  const phraseGroupNode = tree.find(
    linkTypeGroup.phraseGroups,
    getLinkPhrase(relationshipState, linkTypeGroup.backward),
    compareLinkPhraseWithGroup,
  );
  if (phraseGroupNode === null) {
    return null;
  }
  const linkPhraseGroup = phraseGroupNode.value;
  return linkPhraseGroup;
}

export function findLinkPhraseGroupInTargetTypeGroups(
  targetTypeGroups: RelationshipTargetTypeGroupsT,
  relationshipState: RelationshipStateT,
  source: CoreEntityT,
): RelationshipPhraseGroupT | null {
  const backward = isRelationshipBackward(
    relationshipState,
    source,
  );
  const targetType = backward
    ? relationshipState.entity0.entityType
    : relationshipState.entity1.entityType;
  const linkTypeGroup = findLinkTypeGroup(
    findLinkTypeGroups(
      targetTypeGroups,
      source,
      targetType,
    ),
    relationshipState.linkTypeID ?? 0,
    backward,
  );
  if (!linkTypeGroup) {
    return null;
  }
  return findLinkPhraseGroup(
    linkTypeGroup,
    relationshipState,
  );
}

export function findExistingRelationship(
  targetTypeGroups: RelationshipTargetTypeGroupsT | null,
  relationshipState: RelationshipStateT,
  source: CoreEntityT,
): RelationshipStateT | null {
  const linkPhraseGroup = findLinkPhraseGroupInTargetTypeGroups(
    targetTypeGroups,
    relationshipState,
    source,
  );
  if (!linkPhraseGroup) {
    return null;
  }
  const relationshipNode = tree.find(
    linkPhraseGroup.relationships,
    relationshipState,
    getRelationshipsComparator(isRelationshipBackward(
      relationshipState,
      source,
    )),
  );
  if (!relationshipNode) {
    return null;
  }
  return relationshipNode.value;
}

export function* iterateRelationshipsInTargetTypeGroup(
  targetTypeGroup: RelationshipTargetTypeGroupT,
): Generator<RelationshipStateT, void, void> {
  const [/* targetType */, linkTypeGroups] = targetTypeGroup;
  for (const linkTypeGroup of tree.iterate(linkTypeGroups)) {
    for (
      const linkPhraseGroup of tree.iterate(linkTypeGroup.phraseGroups)
    ) {
      yield *tree.iterate(linkPhraseGroup.relationships);
    }
  }
}

export function* iterateRelationshipsInTargetTypeGroups(
  targetTypeGroups: RelationshipTargetTypeGroupsT,
): Generator<RelationshipStateT, void, void> {
  for (const targetTypeGroup of tree.iterate(targetTypeGroups)) {
    yield *iterateRelationshipsInTargetTypeGroup(
      targetTypeGroup,
    );
  }
}
