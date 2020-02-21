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

import relationshipDateText from '../../../../utility/relationshipDateText';
import ButtonPopover from '../../common/components/ButtonPopover';
import DescriptiveLink from '../../common/components/DescriptiveLink';
import {displayLinkAttributesText}
  from '../../common/utility/displayLinkAttribute';
import {bracketedText} from '../../common/utility/bracketed';
import {
  performReactUpdateAndMaintainFocus,
} from '../../common/utility/focusManagement';
import isDatabaseRowId from '../../common/utility/isDatabaseRowId';
import {getPhraseAndExtraAttributesText} from '../../edit/utility/linkPhrase';
import {
  REL_STATUS_ADD,
  REL_STATUS_EDIT,
  REL_STATUS_REMOVE,
} from '../constants';
import useCatalystUser from '../hooks/useCatalystUser';
import useRelationshipDialogContent
  from '../hooks/useRelationshipDialogContent';
import type {
  RelationshipStateT,
} from '../types';
import type {
  RelationshipEditorActionT,
} from '../types/actions';
import getRelationshipKey from '../utility/getRelationshipKey';
import getRelationshipLinkType from '../utility/getRelationshipLinkType';

import NewWorkLink from './NewWorkLink';

type PropsT = {
  +canBeOrdered: boolean,
  +dispatch: (RelationshipEditorActionT) => void,
  +hasOrdering: boolean,
  +relationship: RelationshipStateT,
  +source: CoreEntityT,
};

const RelationshipItem = (React.memo<PropsT>(({
  canBeOrdered,
  dispatch,
  hasOrdering,
  relationship,
  source,
}: PropsT): React.MixedElement => {
  const backward = relationship.entity1.id === source.id;
  const target = backward ? relationship.entity0 : relationship.entity1;
  const [sourceCredit, targetCredit] = backward
    ? [relationship.entity1_credit, relationship.entity0_credit]
    : [relationship.entity0_credit, relationship.entity1_credit];
  const isRemoved = relationship._status === REL_STATUS_REMOVE;
  const removeButtonId =
    'remove-relationship-' + getRelationshipKey(relationship);
  let targetDisplay = null;

  if (
    target.entityType === 'work' &&
    target._fromBatchCreateWorksDialog === true
  ) {
    targetDisplay = <NewWorkLink work={target} />;
  } else if (target.gid) {
    targetDisplay = (
      <DescriptiveLink
        content={targetCredit}
        entity={target}
        showDisambiguation={false}
        /*
         * The entity pending edits display conflicts with the relationship
         * editor's display of pending (unsubmitted) relationship edits.
         */
        showEditsPending={false}
        target="_blank"
      />
    );
  } else {
    targetDisplay = (
      <span className="no-value">
        {target.name || l('no entity')}
      </span>
    );
  }

  if (nonEmpty(sourceCredit)) {
    targetDisplay = exp.l('{target} (as {credited_name})', {
      credited_name: sourceCredit,
      target: targetDisplay,
    });
  }

  const editButtonRef = React.useRef<HTMLButtonElement | null>(null);
  const [isDialogOpen, setDialogOpen] = React.useState(false);

  function removeRelationship(): void {
    performReactUpdateAndMaintainFocus(removeButtonId, function () {
      dispatch({
        relationship,
        type: 'remove-relationship',
      });
    });
  }

  function moveEntityDown() {
    dispatch({relationship, source, type: 'move-relationship-down'});
  }

  function moveEntityUp() {
    dispatch({relationship, source, type: 'move-relationship-up'});
  }

  const dateText = bracketedText(
    relationshipDateText(relationship, /* brackedEnded = */ false),
  );
  const linkType = getRelationshipLinkType(relationship);

  const attributeText = React.useMemo(() => {
    if (!linkType) {
      return '';
    }
    return bracketedText(
      displayLinkAttributesText(getPhraseAndExtraAttributesText(
        linkType,
        tree.toArray(relationship.attributes),
        backward ? 'reverse_link_phrase' : 'link_phrase',
        canBeOrdered /* forGrouping */,
      )[1]),
    );
  }, [
    linkType,
    relationship.attributes,
    backward,
    canBeOrdered,
  ]);

  const isIncomplete = (
    relationship.linkTypeID == null ||
    (
      !isDatabaseRowId(target.id) &&
      /*
       * Incomplete works are allowed to be added by the batch-create-works
       * dialog, and will be created once submitted.
       */
      !(target.entityType === 'work' && target._fromBatchCreateWorksDialog)
    )
  );

  const user = useCatalystUser();

  const buildPopoverContent = useRelationshipDialogContent({
    dispatch,
    relationship,
    source,
    targetTypeOptions: null,
    targetTypeRef: null,
    title: l('Edit Relationship'),
    user,
  });

  const datesAndAttributes = ' ' + (
    dateText
      ? (dateText + (attributeText ? ' ' + attributeText : ''))
      : attributeText
  );

  return (
    <>
      <div className="relationship-item">
        <button
          className="icon remove-item"
          id={removeButtonId}
          onClick={removeRelationship}
          type="button"
        />
        <ButtonPopover
          buildChildren={buildPopoverContent}
          buttonContent={null}
          buttonProps={{
            className: 'icon edit-item',
            id: 'edit-relationship-' + getRelationshipKey(relationship),
          }}
          buttonRef={editButtonRef}
          className="relationship-dialog"
          id="edit-relationship-dialog"
          isDisabled={isRemoved}
          isOpen={isDialogOpen}
          toggle={setDialogOpen}
        />
        {' '}
        {hasOrdering ? (
          <>
            <button
              className="icon move-down"
              disabled={isRemoved}
              onClick={moveEntityDown}
              title={l('Move entity down')}
              type="button"
            />
            <button
              className="icon move-up"
              disabled={isRemoved}
              onClick={moveEntityUp}
              title={l('Move entity up')}
              type="button"
            />
            {' '}
          </>
        ) : null}
        <span className={getRelationshipStyling(relationship)}>
          {relationship.linkOrder ? (
            exp.l('{num}. {relationship}', {
              num: relationship.linkOrder,
              relationship: targetDisplay,
            })
          ) : targetDisplay}
          {datesAndAttributes}
        </span>
      </div>

      {isIncomplete ? (
        <p className="error">
          {l(`You must select a relationship type and target entity for
              every relationship.`)}
        </p>
      ) : null}
    </>
  );
}): React.AbstractComponent<PropsT>);

function getRelationshipStyling(relationship) {
  switch (relationship._status) {
    case REL_STATUS_ADD:
      return 'rel-add';
    case REL_STATUS_EDIT:
      return 'rel-edit';
    case REL_STATUS_REMOVE:
      return 'rel-remove';
  }
  return '';
}

export default RelationshipItem;
