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
  RelationshipLinkTypeGroupT,
} from '../types';
import type {RelationshipEditorActionT} from '../types/actions';

import RelationshipPhraseGroup from './RelationshipPhraseGroup';

type PropsT = {
  +dispatch: (RelationshipEditorActionT) => void,
  +linkTypeGroup: RelationshipLinkTypeGroupT,
  +source: CoreEntityT,
  +targetType: CoreEntityTypeT,
};

const RelationshipLinkTypeGroup = (React.memo<PropsT>(({
  dispatch,
  linkTypeGroup,
  source,
  targetType,
}: PropsT) => {
  const elements = [];
  for (const linkPhraseGroup of tree.iterate(linkTypeGroup.phraseGroups)) {
    elements.push(
      <RelationshipPhraseGroup
        backward={linkTypeGroup.backward}
        dispatch={dispatch}
        key={linkPhraseGroup.key}
        linkPhraseGroup={linkPhraseGroup}
        linkTypeId={linkTypeGroup.typeId}
        source={source}
        targetType={targetType}
      />,
    );
  }
  return elements;
}): React.AbstractComponent<PropsT>);

export default RelationshipLinkTypeGroup;
