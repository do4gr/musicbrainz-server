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

import {
  isLinkTypeOrderableByUser,
} from '../../../../utility/isLinkTypeDirectionOrderable';
import ButtonPopover from '../../common/components/ButtonPopover';
import {useAddRelationshipDialogContent}
  from '../hooks/useRelationshipDialogContent';
import type {
  RelationshipPhraseGroupT,
  RelationshipStateT,
} from '../types';
import type {
  RelationshipEditorActionT,
} from '../types/actions';
import {compareLinkAttributeIds} from '../utility/compareRelationships';

import RelationshipItem from './RelationshipItem';

const addAnotherEntityLabels = {
  area: N_l('Add another area'),
  artist: N_l('Add another artist'),
  event: N_l('Add another event'),
  genre: N_l('Add another genre'),
  instrument: N_l('Add another instrument'),
  label: N_l('Add another label'),
  place: N_l('Add another place'),
  recording: N_l('Add another recording'),
  release: N_l('Add another release'),
  release_group: N_l('Add another release group'),
  series: N_l('Add another series'),
  url: () => '',
  work: N_l('Add another work'),
};

type PropsT = {
  +backward: boolean,
  +dispatch: (RelationshipEditorActionT) => void,
  +linkPhraseGroup: RelationshipPhraseGroupT,
  +linkTypeId: number,
  +source: CoreEntityT,
  +targetType: CoreEntityTypeT,
};

const TEXT_ALIGN_LEFT = {textAlign: 'left'};

function someRelationshipsHaveLinkOrder(
  relationships: tree.ImmutableTree<RelationshipStateT> | null,
): boolean {
  for (const relationship of tree.iterate(relationships)) {
    if (relationship.linkOrder) {
      return true;
    }
  }
  return false;
}

const RelationshipPhraseGroup = (React.memo<PropsT>(({
  backward,
  dispatch,
  linkPhraseGroup,
  linkTypeId,
  source,
  targetType,
}: PropsT) => {
  const relationships = linkPhraseGroup.relationships;
  const relationshipCount = relationships?.size || 0;

  const [isExpanded, setExpanded] = React.useState(relationshipCount <= 10);
  const [isAddDialogOpen, setAddDialogOpen] = React.useState(false);

  const addButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const canBeOrdered = relationshipCount > 1 &&
    isLinkTypeOrderableByUser(linkTypeId, source, backward);

  const hasOrdering = React.useMemo(() => (
    canBeOrdered &&
    someRelationshipsHaveLinkOrder(relationships)
  ), [canBeOrdered, relationships]);

  const buildNewRelationshipData = React.useCallback(() => {
    let maxLinkOrder = 0;
    let newAttributesData = null;

    for (const relationship of tree.iterate(relationships)) {
      if (canBeOrdered) {
        maxLinkOrder = Math.max(maxLinkOrder, relationship.linkOrder);
      }
      newAttributesData = tree.union(
        newAttributesData,
        relationship.attributes,
        compareLinkAttributeIds,
      );
    }

    return {
      // $FlowIgnore[invalid-computed-prop]
      [backward ? 'entity1' : 'entity0']: source,
      attributes: newAttributesData,
      linkOrder: maxLinkOrder > 0 ? (maxLinkOrder + 1) : 0,
      linkTypeID: linkTypeId,
    };
  }, [
    canBeOrdered,
    relationships,
    backward,
    linkTypeId,
    source,
  ]);

  const buildPopoverContent = useAddRelationshipDialogContent({
    backward,
    buildNewRelationshipData,
    defaultTargetType: targetType,
    dispatch,
    source,
    title: l('Add Relationship'),
  });

  function toggleOrdering(event) {
    dispatch({
      hasOrdering: event.target.checked,
      linkPhraseGroup,
      source,
      type: 'toggle-ordering',
    });
  }

  function handleSeeAllClick(event) {
    event.preventDefault();
    setExpanded(true);
  }

  const relationshipItemElements = [];
  for (const relationship of tree.iterate(relationships)) {
    relationshipItemElements.push(
      <RelationshipItem
        canBeOrdered={canBeOrdered}
        dispatch={dispatch}
        hasOrdering={hasOrdering}
        key={relationship.id}
        relationship={relationship}
        source={source}
      />,
    );
    if (!isExpanded && relationshipItemElements.length === 10) {
      break;
    }
  }

  const textPhraseLabel = linkPhraseGroup.textPhrase
    ? addColonText(linkPhraseGroup.textPhrase)
    : null;
  const textPhraseLength = textPhraseLabel?.length ?? 0;
  const textPhraseElement = (
    <label>
      {textPhraseLabel ?? (
        <span className="no-value">
          {addColonText(l('no type'))}
        </span>
      )}
    </label>
  );
  const relationshipListElement = (
    <td className="relationship-list">
      {relationshipItemElements}
      {isExpanded ? null : (
        <p>
          <a href="#" onClick={handleSeeAllClick}>
            {texp.l(
              'See all {num} relationships',
              {num: relationshipCount},
            )}
          </a>
        </p>
      )}
    </td>
  );

  return relationshipCount ? (
    <>
      {/*
        * If the link phrase is too long (common for credited instruments),
        * span it across two columns.
        */}
      {textPhraseLength > 24 ? (
        <>
          <tr>
            <th colSpan="2" style={TEXT_ALIGN_LEFT}>
              {textPhraseElement}
            </th>
          </tr>
          <tr>
            <th />
            {relationshipListElement}
          </tr>
        </>
      ) : (
        <tr>
          <th>
            {textPhraseElement}
          </th>
          {relationshipListElement}
        </tr>
      )}
      {canBeOrdered ? (
        <tr>
          <td />
          <td>
            <label style={{padding: '6px'}}>
              <input
                defaultChecked={hasOrdering}
                onChange={toggleOrdering}
                type="checkbox"
              />
              {' '}
              {l('These relationships have a specific ordering')}
            </label>
          </td>
        </tr>
      ) : null}
      <tr className="add-item-row">
        <td />
        <td>
          <ButtonPopover
            buildChildren={buildPopoverContent}
            buttonContent={addAnotherEntityLabels[targetType]()}
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
    </>
  ) : null;
}): React.AbstractComponent<PropsT>);

export default RelationshipPhraseGroup;
