/*
 * @flow strict-local
 * Copyright (C) 2021 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import ButtonPopover from '../../common/components/ButtonPopover';
import {
  RECORDING_OF_LINK_TYPE_GID,
} from '../../common/constants';
import {createRecordingObject} from '../../common/entity2';
import linkedEntities from '../../common/linkedEntities';
import {
  type MultiselectActionT,
  accumulateMultiselectValues,
} from '../../edit/components/Multiselect';
import DialogAttributes, {
  createInitialState as createDialogAttributesState,
  reducer as dialogAttributesReducer,
} from '../../relationship-editor-v2/components/DialogAttributes';
import DialogButtons
  from '../../relationship-editor-v2/components/DialogButtons';
import DialogLinkType, {
  createInitialState as createDialogLinkTypeState,
  updateDialogState as updateDialogLinkTypeState,
} from '../../relationship-editor-v2/components/DialogLinkType';
import type {
  BatchCreateWorksDialogStateT,
} from '../../relationship-editor-v2/types';
import type {
  DialogAcceptBatchCreateWorksActionT,
  DialogLinkTypeActionT,
  DialogUpdateAttributeActionT,
} from '../../relationship-editor-v2/types/actions';
import getDialogLinkTypeOptions
  from '../../relationship-editor-v2/utility/getDialogLinkTypeOptions';

import WorkLanguageMultiselect, {
  createInitialState as createWorkLanguagesState,
  runReducer as runWorkLanguageMultiselectReducer,
} from './WorkLanguageMultiselect';
import WorkTypeSelect, {
  type WorkTypeSelectActionT,
} from './WorkTypeSelect';

type ActionT =
  | {
      action: DialogUpdateAttributeActionT,
      type: 'update-attribute',
    }
  | {
      action: MultiselectActionT<LanguageT>,
      type: 'update-languages',
    }
  | {
      action: DialogLinkTypeActionT,
      source: CoreEntityT,
      type: 'update-link-type',
    }
  | WorkTypeSelectActionT;

const RECORDING_PLACEHOLDER = createRecordingObject();

export function createInitialState(): BatchCreateWorksDialogStateT {
  return {
    attributes: createDialogAttributesState(
      linkedEntities.link_type[RECORDING_OF_LINK_TYPE_GID],
      null,
    ),
    languages: createWorkLanguagesState(),
    linkType: createDialogLinkTypeState(
      linkedEntities.link_type[RECORDING_OF_LINK_TYPE_GID],
      RECORDING_PLACEHOLDER,
      'work',
      getDialogLinkTypeOptions(RECORDING_PLACEHOLDER, 'work'),
      'batch-create-works',
      true, /* disabled */
      /*
       * There is only one selectable link type at the moment
       * (recording of), so the autocomplete is disabled. This
       * allows focus to start on "Work Type" instead.
       */
    ),
    workType: null,
  };
}

function reducer(
  state: BatchCreateWorksDialogStateT,
  action: ActionT,
): BatchCreateWorksDialogStateT {
  const newState = {...state};

  switch (action.type) {
    case 'update-attribute': {
      newState.attributes = dialogAttributesReducer(
        newState.attributes,
        action.action,
      );
      break;
    }

    case 'update-languages': {
      const newLanguages = {...newState.languages};

      runWorkLanguageMultiselectReducer(
        newLanguages,
        action.action,
      );

      newState.languages = newLanguages;
      break;
    }

    case 'update-link-type': {
      updateDialogLinkTypeState(state, newState, action);
      break;
    }

    case 'update-work-type': {
      newState.workType = action.workType;
      break;
    }
  }

  return newState;
}

type BatchCreateWorksDialogContentPropsT = {
  +closeDialog: () => void,
  +sourceDispatch: (DialogAcceptBatchCreateWorksActionT) => void,
};

const BatchCreateWorksDialogContent = React.memo<
  BatchCreateWorksDialogContentPropsT,
>(({
  closeDialog,
  sourceDispatch,
}: BatchCreateWorksDialogContentPropsT): React.MixedElement => {
  const [state, dispatch] = React.useReducer(
    reducer,
    null,
    createInitialState,
  );

  const {
    attributes,
    languages,
    linkType: linkTypeState,
    workType,
  } = state;

  const hasErrors = !!(
    nonEmpty(linkTypeState.error) ||
    attributes.attributesList.some(x => x.error)
  );

  const linkTypeDispatch = React.useCallback((action) => {
    dispatch({
      action,
      source: RECORDING_PLACEHOLDER,
      type: 'update-link-type',
    });
  }, [dispatch]);

  const attributesDispatch = React.useCallback((action) => {
    dispatch({action, type: 'update-attribute'});
  }, [dispatch]);

  const languagesDispatch = React.useCallback((action) => {
    dispatch({action, type: 'update-languages'});
  }, [dispatch]);

  const acceptDialog = React.useCallback(() => {
    const linkType = linkTypeState.autocomplete.selectedEntity;

    invariant(!hasErrors && linkType);

    sourceDispatch({
      attributes: attributes.resultingLinkAttributes,
      languages: accumulateMultiselectValues(languages.values),
      linkType,
      type: 'accept-batch-create-works-dialog',
      workType,
    });

    closeDialog();
  }, [
    hasErrors,
    linkTypeState.autocomplete.selectedEntity,
    attributes.resultingLinkAttributes,
    languages.values,
    workType,
    closeDialog,
    sourceDispatch,
  ]);

  return (
    <>
      <p className="msg">
        {l(`This will create a new work for each checked recording that has no
            work already. The work names will be the same as their respective
            recording.`)}
      </p>
      <p className="msg warning">
        {l(`Only use this option after you’ve tried searching for the work(s)
            you want to create, and are certain they do not already exist on
            MusicBrainz.`)}
      </p>
      <table className="relationship-details">
        <tbody>
          <DialogLinkType
            dispatch={linkTypeDispatch}
            source={RECORDING_PLACEHOLDER}
            state={linkTypeState}
          />
          <WorkTypeSelect
            dispatch={dispatch}
            workType={workType}
          />
          <WorkLanguageMultiselect
            dispatch={languagesDispatch}
            state={languages}
          />
          <DialogAttributes
            dispatch={attributesDispatch}
            state={attributes}
          />
        </tbody>
      </table>
      <DialogButtons
        isDoneDisabled={hasErrors}
        onCancel={closeDialog}
        onDone={acceptDialog}
      />
    </>
  );
});

type BatchCreateWorksButtonPopoverPropsT = {
  +dispatch: (DialogAcceptBatchCreateWorksActionT) => void,
  +isDisabled: boolean,
};

export const BatchCreateWorksButtonPopover = (React.memo<
  BatchCreateWorksButtonPopoverPropsT,
>(({
  dispatch,
  isDisabled,
}: BatchCreateWorksButtonPopoverPropsT): React.MixedElement => {
  const [isOpen, setOpen] = React.useState(false);
  const addButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const closeDialog = React.useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const buildPopoverContent = React.useCallback(() => (
    <BatchCreateWorksDialogContent
      closeDialog={closeDialog}
      sourceDispatch={dispatch}
    />
  ), [closeDialog, dispatch]);

  return (
    <ButtonPopover
      buildChildren={buildPopoverContent}
      buttonContent={l('Batch-create new works')}
      buttonProps={{
        className: 'add-item with-label',
      }}
      buttonRef={addButtonRef}
      className="relationship-dialog"
      id="batch-create-works-dialog"
      isDisabled={isDisabled}
      isOpen={isOpen}
      toggle={setOpen}
    />
  );
}): React.AbstractComponent<BatchCreateWorksButtonPopoverPropsT, mixed>);
