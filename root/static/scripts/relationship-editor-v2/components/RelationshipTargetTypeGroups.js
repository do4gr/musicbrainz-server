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

import ButtonPopover from '../../common/components/ButtonPopover';
import {useAddRelationshipDialogContent}
  from '../hooks/useRelationshipDialogContent';
import type {
  RelationshipTargetTypeGroupsT,
} from '../types';
import type {RelationshipEditorActionT} from '../types/actions';

import RelationshipTargetTypeGroup from './RelationshipTargetTypeGroup';

type PropsT = {
  +dispatch: (RelationshipEditorActionT) => void,
  +filter?: (CoreEntityTypeT) => boolean,
  +source: CoreEntityT,
  +targetTypeGroups: RelationshipTargetTypeGroupsT,
};

const RelationshipTargetTypeGroups = (React.memo<PropsT>(({
  dispatch,
  filter,
  source,
  targetTypeGroups,
}: PropsT): React.MixedElement => {
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);
  const addButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const buildPopoverContent = useAddRelationshipDialogContent({
    defaultTargetType: null,
    dispatch,
    source,
    title: l('Add Relationship'),
  });

  const sections = [];
  for (const [targetType, linkTypeGroups] of tree.iterate(targetTypeGroups)) {
    if (linkTypeGroups?.size && (filter == null || filter(targetType))) {
      sections.push(
        <RelationshipTargetTypeGroup
          dispatch={dispatch}
          key={targetType}
          linkTypeGroups={linkTypeGroups}
          source={source}
          targetType={targetType}
        />,
      );
    }
  }

  return (
    <table className="rel-editor-table">
      <tbody>
        {sections}
        <tr>
          <td colSpan="2">
            <ButtonPopover
              buildChildren={buildPopoverContent}
              buttonContent={l('Add relationship')}
              buttonProps={{
                className: 'add-item with-label',
              }}
              buttonRef={addButtonRef}
              className="relationship-dialog"
              id="add-relationship-dialog"
              isDisabled={false}
              isOpen={isAddDialogOpen}
              toggle={setAddDialogOpen}
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}): React.AbstractComponent<PropsT>);

export default RelationshipTargetTypeGroups;
