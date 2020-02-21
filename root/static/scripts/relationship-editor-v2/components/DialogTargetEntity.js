/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import Autocomplete2, {
  createInitialState as createInitialAutocompleteState,
} from '../../common/components/Autocomplete2';
import {default as autocompleteReducer}
  from '../../common/components/Autocomplete2/reducer';
import type {
  OptionItemT,
  PropsT as AutocompletePropsT,
  StateT as AutocompleteStateT,
} from '../../common/components/Autocomplete2/types';
import {
  ENTITY_NAMES,
  ENTITIES_WITH_RELATIONSHIP_CREDITS,
  PART_OF_SERIES_LINK_TYPE_GIDS,
} from '../../common/constants';
import {
  createNonUrlCoreEntityObject,
} from '../../common/entity2';
import linkedEntities from '../../common/linkedEntities';
import isDatabaseRowId from '../../common/utility/isDatabaseRowId';
import type {
  DialogTargetEntityStateT,
  RelationshipStateT,
  TargetTypeOptionsT,
} from '../types';
import type {
  DialogTargetEntityActionT,
  UpdateTargetEntityAutocompleteActionT,
} from '../types/actions';
import getRelationshipLinkType from '../utility/getRelationshipLinkType';
import isRelationshipBackward from '../utility/isRelationshipBackward';

import DialogEntityCredit, {
  createInitialState as createDialogEntityCreditState,
  reducer as dialogEntityCreditReducer,
} from './DialogEntityCredit';

type PropsT = {
  +allowedTypes: TargetTypeOptionsT | null,
  +backward: boolean,
  +dispatch: (DialogTargetEntityActionT) => void,
  +linkType: LinkTypeT | null,
  +source: CoreEntityT,
  +state: DialogTargetEntityStateT,
};

const INCORRECT_SERIES_ENTITY_MESSAGES = {
  artist: N_l('The series you’ve selected is for artists.'),
  event: N_l('The series you’ve selected is for events.'),
  recording: N_l('The series you’ve selected is for recordings.'),
  release: N_l('The series you’ve selected is for releases.'),
  release_group: N_l('The series you’ve selected is for release groups.'),
  work: N_l('The series you’ve selected is for works.'),
};

function isTargetSelectable(target: CoreEntityT): boolean {
  return (
    isDatabaseRowId(target.id) ||
    (
      target.entityType === 'work' &&
      target._fromBatchCreateWorksDialog === true
    )
  );
}

export function getTargetError(
  target: CoreEntityT | null,
  source: CoreEntityT,
  linkType: LinkTypeT | null,
): string {
  if (!target || !isTargetSelectable(target)) {
    return l('Required field.');
  }

  if (source.gid === target.gid) {
    return l('Entities in a relationship cannot be the same.');
  }

  if (target.entityType === 'series') {
    const seriesTypeId = target.typeID;
    invariant(
      seriesTypeId != null,
      'Existing series must have a type set',
    );
    const seriesType = linkedEntities.series_type[String(seriesTypeId)];
    const seriesItemType = seriesType.item_entity_type;
    if (
      linkType &&
      PART_OF_SERIES_LINK_TYPE_GIDS.includes(linkType.gid) &&
      seriesItemType !== source.entityType
    ) {
      return INCORRECT_SERIES_ENTITY_MESSAGES[seriesItemType]();
    }
  }

  return '';
}

const returnFalse = () => false;

export function createInitialAutocompleteStateForTarget(
  target: NonUrlCoreEntityT,
  relationshipId: number,
  allowedTypes: TargetTypeOptionsT | null,
): AutocompleteStateT<NonUrlCoreEntityT> {
  return createInitialAutocompleteState<NonUrlCoreEntityT>({
    canChangeType: allowedTypes ? (newType) => (
      allowedTypes.some(option => option.value === newType)
    ) : returnFalse,
    entityType: target.entityType,
    id: 'relationship-target-' + String(relationshipId),
    inputChangeHook: selectNewWork,
    inputValue: target.name,
    selectedEntity: isTargetSelectable(target) ? target : null,
  });
}

export function createInitialState(
  user: ActiveEditorT,
  source: CoreEntityT,
  initialRelationship: RelationshipStateT,
  allowedTypes: TargetTypeOptionsT | null,
): DialogTargetEntityStateT {
  const backward = isRelationshipBackward(initialRelationship, source);
  const target = backward
    ? initialRelationship.entity0
    : initialRelationship.entity1;

  let autocomplete = null;
  if (target.entityType !== 'url') {
    autocomplete = createInitialAutocompleteStateForTarget(
      target,
      initialRelationship.id,
      allowedTypes,
    );
  }

  return {
    ...createDialogEntityCreditState(
      backward
        ? initialRelationship.entity0_credit
        : initialRelationship.entity1_credit,
    ),
    allowedTypes,
    autocomplete,
    error: getTargetError(
      target,
      source,
      getRelationshipLinkType(initialRelationship),
    ),
    relationshipId: initialRelationship.id,
    target,
    targetType: target.entityType,
  };
}

const NEW_WORK_HASH = /#new-work-(-[0-9]+)$/;

function selectNewWork(
  newInputValue: string,
  state: AutocompleteStateT<NonUrlCoreEntityT>,
  selectItem: (OptionItemT<NonUrlCoreEntityT>) => boolean,
): boolean {
  const match = newInputValue.match(NEW_WORK_HASH);
  if (match) {
    const newWorkId = match[1];
    const newWork = linkedEntities.work[+newWorkId];
    if (newWork) {
      return selectItem({
        entity: newWork,
        id: newWork.id,
        name: newWork.name,
        type: 'option',
      });
    }
  }
  return false;
}

export function updateTargetAutocomplete(
  newState: {...DialogTargetEntityStateT},
  action: UpdateTargetEntityAutocompleteActionT,
): void {
  invariant(newState.autocomplete);

  newState.autocomplete = autocompleteReducer<NonUrlCoreEntityT>(
    newState.autocomplete,
    action.action,
  );

  newState.error = getTargetError(
    newState.autocomplete.selectedEntity,
    action.source,
    action.linkType,
  );
}

export function reducer(
  state: DialogTargetEntityStateT,
  action: DialogTargetEntityActionT,
): DialogTargetEntityStateT {
  switch (action.type) {
    case 'update-autocomplete': {
      const newState: {...DialogTargetEntityStateT} = {...state};

      updateTargetAutocomplete(newState, action);

      const autocomplete = newState.autocomplete;

      /*:: invariant(autocomplete); */
      /*:: invariant(newState.targetType !== 'url'); */

      newState.targetType = autocomplete.entityType;

      const newTarget = autocomplete.selectedEntity ||
        createNonUrlCoreEntityObject(newState.targetType, {
          name: autocomplete.inputValue,
        });

      if (
        state.target.entityType !== newTarget.entityType ||
        state.target.id !== newTarget.id ||
        state.target.name !== newTarget.name
      ) {
        newState.target = newTarget;
      }

      return newState;
    }
    case 'update-credit': {
      return dialogEntityCreditReducer(
        state,
        action.action,
      );
    }
    case 'update-url-text': {
      invariant(state.targetType === 'url');

      const newState: {...DialogTargetEntityStateT} = {...state};

      invariant(newState.target.entityType === 'url');

      const newTarget = {...newState.target};
      const url = action.text;
      newTarget.name = url;
      newState.target = newTarget;

      return newState;
    }
    default: {
      /*:: exhaustive(action); */
      invariant(false);
    }
  }
}

// XXX Until Flow supports https://github.com/facebook/flow/issues/7672
const TargetAutocomplete:
  React$AbstractComponent<AutocompletePropsT<NonUrlCoreEntityT>, void> =
  // $FlowIgnore[incompatible-type]
  Autocomplete2;

const DialogTargetEntity = (React.memo<PropsT>((
  props: PropsT,
): React.MixedElement => {
  const {
    backward,
    dispatch,
    linkType,
    source,
    state,
  } = props;

  const autocomplete = state.autocomplete;
  const targetType = state.targetType;

  if (__DEV__) {
    if (autocomplete) {
      invariant(autocomplete.entityType === targetType);
    }
  }

  const autocompleteDispatch = React.useCallback((action) => {
    dispatch({
      action,
      linkType,
      source,
      type: 'update-autocomplete',
    });
  }, [dispatch, linkType, source]);

  function handleUrlTextChange(event) {
    dispatch({
      text: event.target.value,
      type: 'update-url-text',
    });
  }

  const creditDispatch = React.useCallback((action) => {
    dispatch({action, type: 'update-credit'});
  }, [dispatch]);

  const showTargetCredit = !!(
    ENTITIES_WITH_RELATIONSHIP_CREDITS[targetType] &&
    autocomplete?.selectedEntity
  );

  return (
    <>
      <tr>
        <td className="required section">
          {addColonText(ENTITY_NAMES[targetType]())}
        </td>
        <td className="fields">
          {targetType === 'url' ? (
            <input
              onChange={handleUrlTextChange}
              type="text"
              value={state.target.name}
            />
          ) : autocomplete ? (
            <TargetAutocomplete
              dispatch={autocompleteDispatch}
              state={autocomplete}
            />
          ) : null}

          <div className="error">
            {state.error}
          </div>
        </td>
      </tr>
      {showTargetCredit ? (
        <DialogEntityCredit
          backward={backward}
          dispatch={creditDispatch}
          entityName={state.target.name}
          linkType={linkType}
          state={state}
          targetType={source.entityType}
        />
      ) : null}
    </>
  );
}): React.AbstractComponent<PropsT>);

export default DialogTargetEntity;
