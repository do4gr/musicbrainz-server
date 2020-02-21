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

import isDisabledLink from '../../../../utility/isDisabledLink';
import EntityLink from '../../common/components/EntityLink';
import Relationship from '../../common/components/Relationship';
import RelationshipDiff from '../../edit/components/edit/RelationshipDiff';
import type {
  RelationshipStateT,
} from '../types';
import relationshipsAreIdentical from '../utility/relationshipsAreIdentical';

type PropsT = {
  +backward: boolean,
  +dispatch: ({+type: 'change-direction'}) => void,
  +newRelationship: RelationshipStateT | null,
  +oldRelationship: RelationshipStateT | null,
  +source: CoreEntityT,
};

const makeEntityLink = (
  entity,
  content,
  relationship,
) => (
  <EntityLink
    allowNew
    content={content}
    disableLink={isDisabledLink(relationship, entity)}
    entity={entity}
    showDisambiguation={false}
    target="_blank"
  />
);

const createRelationshipTFromState = (
  relationship: RelationshipStateT,
  source: CoreEntityT,
  backward: boolean,
) => {
  const target = backward ? relationship.entity0 : relationship.entity1;
  return {
    attributes: tree.toArray(relationship.attributes),
    backward,
    begin_date: relationship.begin_date,
    editsPending: relationship.editsPending,
    end_date: relationship.end_date,
    ended: relationship.ended,
    entity0: relationship.entity0,
    entity0_credit: relationship.entity0_credit,
    entity0_id: relationship.entity0.id,
    entity1: relationship.entity1,
    entity1_credit: relationship.entity1_credit,
    entity1_id: relationship.entity1.id,
    id: relationship.id ?? 0,
    linkOrder: relationship.linkOrder,
    linkTypeID: relationship.linkTypeID ?? 0,
    source_id: source.id,
    source_type: source.entityType,
    target,
    target_type: target.entityType,
    verbosePhrase: '',
  };
};

const DialogPreview = (React.memo<PropsT>(({
  backward,
  dispatch,
  source,
  newRelationship,
  oldRelationship,
}: PropsT): React.Element<'fieldset'> => {
  function changeDirection() {
    dispatch({type: 'change-direction'});
  }

  const targetType = backward
    ? newRelationship?.entity0.entityType
    : newRelationship?.entity1.entityType;

  const relationshipPreview = (relationship, className) => {
    return (
      <table className={'details' + (className ? ' ' + className : '')}>
        <tbody>
          <tr>
            <th>{l('Relationship:')}</th>
            <td>
              <Relationship
                makeEntityLink={makeEntityLink}
                relationship={createRelationshipTFromState(
                  relationship,
                  source,
                  backward,
                )}
              />
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  return (
    <fieldset>
      <legend>
        {l('Preview')}
      </legend>
      {(oldRelationship && newRelationship) ? (
        relationshipsAreIdentical(oldRelationship, newRelationship)
          ? relationshipPreview(newRelationship, '')
          : (
            <table className="details edit-relationship">
              <tbody>
                <RelationshipDiff
                  makeEntityLink={makeEntityLink}
                  newRelationship={createRelationshipTFromState(
                    newRelationship,
                    source,
                    backward,
                  )}
                  oldRelationship={createRelationshipTFromState(
                    oldRelationship,
                    source,
                    backward,
                  )}
                />
              </tbody>
            </table>
          )
      ) : newRelationship ? (
        relationshipPreview(newRelationship, 'add-relationship')
      ) : (
        <p>
          {l('Please fill out all required fields.')}
        </p>
      )}

      {source.entityType === targetType ? (
        <>
          {' '}
          <button
            className="styled-button change-direction"
            onClick={changeDirection}
            type="button"
          >
            {l('Change direction')}
          </button>
        </>
      ) : null}
    </fieldset>
  );
}): React.AbstractComponent<PropsT>);

export default DialogPreview;
