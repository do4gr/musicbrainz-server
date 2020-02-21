/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';
import * as tree from 'weight-balanced-tree';

import type {
  RelationshipLinkTypeGroupsT,
} from '../types';
import type {RelationshipEditorActionT} from '../types/actions';

import RelationshipLinkTypeGroup from './RelationshipLinkTypeGroup';

type Props = {
  +dispatch: (RelationshipEditorActionT) => void,
  +linkTypeGroups: RelationshipLinkTypeGroupsT,
  +source: CoreEntityT,
  +targetType: CoreEntityTypeT,
};

const RelationshipTargetTypeGroup = (React.memo<Props>(({
  dispatch,
  linkTypeGroups,
  source,
  targetType,
}: Props) => {
  const elements = [];
  for (const linkTypeGroup of tree.iterate(linkTypeGroups)) {
    elements.push(
      <RelationshipLinkTypeGroup
        dispatch={dispatch}
        key={
          (linkTypeGroup.backward ? '1' : '0') +
          String(linkTypeGroup.typeId)
        }
        linkTypeGroup={linkTypeGroup}
        source={source}
        targetType={targetType}
      />,
    );
  }
  return elements;
}): React.AbstractComponent<Props>);

export default RelationshipTargetTypeGroup;
