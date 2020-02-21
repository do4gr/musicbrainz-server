/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

// $FlowIgnore[untyped-import]
import deepFreeze from 'deep-freeze-strict';
import * as React from 'react';
import {captureException} from '@sentry/browser';
import * as tree from 'weight-balanced-tree';
import {ValueExistsError} from 'weight-balanced-tree/errors';
import {
  onConflictKeepTreeValue,
  onConflictUseGivenValue,
} from 'weight-balanced-tree/update';

import {decompactEntityJson} from '../../../../utility/compactEntityJson';
import {INSTRUMENT_ROOT_ID, VOCAL_ROOT_ID} from '../../common/constants';
import {
  getSourceEntityDataForRelationshipEditor,
} from '../../common/utility/catalyst';
import isDatabaseRowId from '../../common/utility/isDatabaseRowId';
import {hasSessionStorage} from '../../common/utility/storage';
import reducerWithErrorHandling
  from '../../edit/utility/reducerWithErrorHandling';
import {
  REL_STATUS_ADD,
  REL_STATUS_NOOP,
  REL_STATUS_REMOVE,
  RelationshipSourceGroupsContext,
} from '../constants';
import type {
  RelationshipEditorStateT,
  RelationshipSourceGroupsT,
  RelationshipStateT,
  ReleaseRelationshipEditorStateT,
  SeededRelationshipT,
} from '../types';
import type {
  RelationshipEditorActionT,
} from '../types/actions';
import {
  cloneRelationshipEditorState,
  cloneRelationshipState,
} from '../utility/cloneState';
import {
  compareLinkAttributeIds,
} from '../utility/compareRelationships';
import {
  findTargetTypeGroups,
} from '../utility/findState';
import getRelationshipEditStatus from '../utility/getRelationshipEditStatus';
import getRelationshipLinkType from '../utility/getRelationshipLinkType';
import getRelationshipStateId from '../utility/getRelationshipStateId';
import getRelationshipTarget from '../utility/getRelationshipTarget';
import isRelationshipBackward from '../utility/isRelationshipBackward';
import mergeRelationship from '../utility/mergeRelationship';
import moveRelationship from '../utility/moveRelationship';
import prepareHtmlFormSubmission from '../utility/prepareHtmlFormSubmission';
import relationshipsAreIdentical from '../utility/relationshipsAreIdentical';
import splitRelationshipByAttributes
  from '../utility/splitRelationshipByAttributes';
import updateEntityCredits from '../utility/updateEntityCredits';
import type {RelationshipUpdateT} from '../utility/updateRelationships';
import updateRelationships, {
  ADD_RELATIONSHIP,
  REMOVE_RELATIONSHIP,
} from '../utility/updateRelationships';

import RelationshipTargetTypeGroups from './RelationshipTargetTypeGroups';

export type PropsT = {
  +dispatch: (RelationshipEditorActionT) => void,
  +formName: string,
  +state: RelationshipEditorStateT,
};

export type InitialStateArgsT = {
  +$c: CatalystContextT,
  +formName: string,
  +seededRelationships: ?$ReadOnlyArray<SeededRelationshipT>,
};

export function* getInitialRelationshipUpdates(
  relationships:
    | $ReadOnlyArray<RelationshipT>
    | $ReadOnlyArray<SeededRelationshipT>,
  source: CoreEntityT,
): Generator<RelationshipUpdateT, void, void> {
  for (const relationshipData of relationships) {
    if (relationshipData.target_type === 'url') {
      continue;
    }

    const {backward, target} = relationshipData;

    const relationshipState: RelationshipStateT = {
      _original: null,
      _status: isDatabaseRowId(relationshipData.id)
        ? REL_STATUS_NOOP
        : REL_STATUS_ADD,
      attributes: tree.fromDistinctAscArray(
        relationshipData.attributes.slice(0).sort(compareLinkAttributeIds),
      ),
      begin_date: relationshipData.begin_date,
      editsPending: relationshipData.editsPending,
      end_date: relationshipData.end_date,
      ended: relationshipData.ended,
      entity0: backward ? target : source,
      entity0_credit: relationshipData.entity0_credit,
      entity1: backward ? source : target,
      entity1_credit: relationshipData.entity1_credit,
      id: getRelationshipStateId(relationshipData),
      linkOrder: relationshipData.linkOrder,
      linkTypeID: relationshipData.linkTypeID,
    };

    if (isDatabaseRowId(relationshipData.id)) {
      /*
       * Writing here is sound because the object was just created.
       * (This is needed to create a self-reference.)
       */
      // $FlowIgnore[cannot-write]
      relationshipState._original = relationshipState;
    }

    yield {
      onConflict: onConflictKeepTreeValue,
      relationship: relationshipState,
      type: ADD_RELATIONSHIP,
    };

    if (target.relationships) {
      yield *getInitialRelationshipUpdates(
        target.relationships,
        target,
      );
    }
  }
}

export function createInitialState(
  args: InitialStateArgsT,
): RelationshipEditorStateT {
  const {seededRelationships} = args;

  const source = getSourceEntityDataForRelationshipEditor();

  invariant(
    source.entityType !== 'release',
    'Cannot initialize the mini relationship editor with a release',
  );

  const newState: {...RelationshipEditorStateT} = {
    entity: source,
    existingRelationshipsBySource: null,
    reducerError: null,
    relationshipsBySource: null,
  };

  if (source.relationships) {
    updateRelationships(
      newState,
      getInitialRelationshipUpdates(source.relationships, source),
    );
  }

  newState.existingRelationshipsBySource = newState.relationshipsBySource;

  if (seededRelationships) {
    updateRelationships(
      newState,
      getInitialRelationshipUpdates(seededRelationships, source),
    );
  }

  return newState;
}

export function loadOrCreateInitialState(
  args: InitialStateArgsT,
): RelationshipEditorStateT {
  if (hasSessionStorage && args.$c.req.method === 'POST') {
    const submission = sessionStorage.getItem('relationshipEditorState');
    if (nonEmpty(submission)) {
      try {
        // $FlowIgnore[unclear-type]
        return (decompactEntityJson(JSON.parse(submission)): any);
      } catch (e) {
        captureException(e);
      } finally {
        /*
         * XXX React seems to double-invoke `loadOrCreateInitialState` in
         * development, so delay the sessionStorage removal.
         */
        setTimeout(() => {
          sessionStorage.removeItem('relationshipEditorState');
        }, 1000);
      }
    }
  }
  return createInitialState(args);
}

export function* getUpdatesForAcceptedRelationship(
  rootState: {
    +existingRelationshipsBySource: RelationshipSourceGroupsT,
    +relationshipsBySource: RelationshipSourceGroupsT,
    ...
  },
  newRelationshipState: RelationshipStateT,
  source: CoreEntityT,
): Generator<RelationshipUpdateT, void, void> {
  const mergeAndYieldUpdates = function* (
    relationshipState: RelationshipStateT,
  ): Generator<RelationshipUpdateT, void, void> {
    const mergeUpdates = mergeRelationship(
      findTargetTypeGroups(
        rootState.relationshipsBySource,
        source,
      ),
      findTargetTypeGroups(
        rootState.existingRelationshipsBySource,
        source,
      ),
      relationshipState,
      source,
    );
    if (mergeUpdates) {
      yield *mergeUpdates;
    } else {
      yield {
        onConflict: onConflictKeepTreeValue,
        relationship: relationshipState,
        type: ADD_RELATIONSHIP,
      };
    }
  };

  const linkType = getRelationshipLinkType(
    newRelationshipState,
  );
  /*:: invariant(linkType); */

  if (
    linkType.attributes[INSTRUMENT_ROOT_ID] != null ||
    linkType.attributes[VOCAL_ROOT_ID] != null
  ) {
    const splitRelationships = splitRelationshipByAttributes(
      newRelationshipState,
    );
    for (const relationshipState of splitRelationships) {
      yield *mergeAndYieldUpdates(relationshipState);
    }
  } else {
    yield *mergeAndYieldUpdates(newRelationshipState);
  }
}

export const reducer: ((
  state: RelationshipEditorStateT,
  action: RelationshipEditorActionT,
) => RelationshipEditorStateT) = reducerWithErrorHandling((
  state,
  action,
): RelationshipEditorStateT => {
  const writableState: {...RelationshipEditorStateT} =
    cloneRelationshipEditorState(state);
  runReducer(writableState, action);
  return writableState;
});

export function runReducer(
  writableState:
    | {...RelationshipEditorStateT}
    | {...ReleaseRelationshipEditorStateT},
  action: RelationshipEditorActionT,
): void {
  switch (action.type) {
    case 'accept-relationship-dialog': {
      const {
        creditsToChangeForSource,
        creditsToChangeForTarget,
        newRelationshipState,
        oldRelationshipState,
        sourceEntity,
      } = action;

      if (!relationshipsAreIdentical(
        oldRelationshipState,
        newRelationshipState,
      )) {
        const targetEntity = getRelationshipTarget(
          newRelationshipState,
          sourceEntity,
        );
        const updates = [
          {
            relationship: oldRelationshipState,
            throwIfNotExists: false,
            type: REMOVE_RELATIONSHIP,
          },
          ...getUpdatesForAcceptedRelationship(
            writableState,
            newRelationshipState,
            sourceEntity,
          ),
        ];

        /*
         * `updateEntityCredits` only uses `newRelationshipState` to obtain
         * the entity credits, link type, and direction, so it's fine and
         * intended that we don't invoke it for each "split" relationship
         * from `getUpdatesForAcceptedRelationship`.
         */
        if (creditsToChangeForSource) {
          updates.push(...updateEntityCredits(
            writableState.relationshipsBySource,
            newRelationshipState,
            creditsToChangeForSource,
            sourceEntity,
            isRelationshipBackward(newRelationshipState, sourceEntity)
              ? newRelationshipState.entity1_credit
              : newRelationshipState.entity0_credit,
          ));
        }

        if (creditsToChangeForTarget) {
          updates.push(...updateEntityCredits(
            writableState.relationshipsBySource,
            newRelationshipState,
            creditsToChangeForTarget,
            targetEntity,
            isRelationshipBackward(newRelationshipState, targetEntity)
              ? newRelationshipState.entity1_credit
              : newRelationshipState.entity0_credit,
          ));
        }

        try {
          updateRelationships(writableState, updates);
        } catch (error) {
          if (error instanceof ValueExistsError) {
            alert(l('This relationship already exists.'));
          } else {
            throw error;
          }
        }
      }

      break;
    }

    case 'remove-relationship': {
      const {relationship} = action;

      const updates = [
        {
          relationship,
          throwIfNotExists: true,
          type: REMOVE_RELATIONSHIP,
        },
      ];

      if (relationship._original) {
        const newRelationshipState =
          cloneRelationshipState(relationship._original);
        // Clicking the `x` again undoes the removal.
        newRelationshipState._status =
          relationship._status === REL_STATUS_REMOVE
            ? REL_STATUS_NOOP
            : REL_STATUS_REMOVE;
        updates.push({
          onConflict: onConflictUseGivenValue,
          relationship: newRelationshipState,
          type: ADD_RELATIONSHIP,
        });
      }

      updateRelationships(writableState, updates);
      break;
    }

    case 'move-relationship-down': {
      moveRelationship(
        writableState,
        action.relationship,
        action.source,
        true,
      );
      break;
    }

    case 'move-relationship-up': {
      moveRelationship(
        writableState,
        action.relationship,
        action.source,
        false,
      );
      break;
    }

    case 'toggle-ordering': {
      const {
        hasOrdering,
        linkPhraseGroup,
      } = action;

      const updates = [];
      let nextLogicalLinkOrder = 1;

      for (
        const relationship of
        tree.iterate(linkPhraseGroup.relationships)
      ) {
        const newRelationship = cloneRelationshipState(relationship);

        newRelationship.linkOrder =
          hasOrdering ? (nextLogicalLinkOrder++) : 0;
        newRelationship._status = getRelationshipEditStatus(
          newRelationship,
        );

        updates.push(
          {
            relationship,
            throwIfNotExists: true,
            type: REMOVE_RELATIONSHIP,
          },
          {
            onConflict: onConflictUseGivenValue,
            relationship: newRelationship,
            type: ADD_RELATIONSHIP,
          },
        );
      }

      updateRelationships(writableState, updates);
      break;
    }

    case 'update-entity': {
      invariant(
        writableState.entity.entityType === action.entityType,
        'Cannot change the relationship editor entity type',
      );
      // $FlowIgnore[cannot-spread-indexer]
      writableState.entity = {
        ...writableState.entity,
        ...action.changes,
      };
      break;
    }
  }

  if (__DEV__) {
    deepFreeze(writableState);
  }
}

const RelationshipEditor = (
  props: PropsT,
): React.Element<'fieldset'> | null => {
  const {
    dispatch,
    formName,
    state,
  } = props;

  const reducerError = state.reducerError;

  const submissionInProgress = React.useRef(false);

  React.useEffect(() => {
    const handleSubmission = () => {
      if (!submissionInProgress.current) {
        submissionInProgress.current = true;
        prepareHtmlFormSubmission(formName, state);
      }
    };

    document.addEventListener('submit', handleSubmission);

    return () => {
      document.removeEventListener('submit', handleSubmission);
    };
  });

  const sourceGroupsContext = React.useMemo(() => ({
    existing: state.existingRelationshipsBySource,
    pending: state.relationshipsBySource,
  }), [
    state.existingRelationshipsBySource,
    state.relationshipsBySource,
  ]);

  return (
    <fieldset id="relationship-editor">
      {reducerError ? (
        <div className="error">
          <strong className="error">
            {l('Oops, something went wrong!')}
          </strong>
          <br />
          <pre style={{whiteSpace: 'pre-wrap'}}>
            {reducerError.stack}
          </pre>
        </div>
      ) : null}

      <legend>
        {l('Relationships')}
      </legend>

      <RelationshipSourceGroupsContext.Provider value={sourceGroupsContext}>
        <RelationshipTargetTypeGroups
          dispatch={dispatch}
          source={state.entity}
          targetTypeGroups={findTargetTypeGroups(
            state.relationshipsBySource,
            state.entity,
          )}
        />
      </RelationshipSourceGroupsContext.Provider>
    </fieldset>
  );
};

export default RelationshipEditor;
