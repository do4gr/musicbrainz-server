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
import {createCoreEntityObject} from '../../common/entity2';
import {
  useAddRelationshipDialogContent,
} from '../../relationship-editor-v2/hooks/useRelationshipDialogContent';
import type {
  ReleaseRelationshipEditorActionT,
} from '../../relationship-editor-v2/types/actions';

import {BatchCreateWorksButtonPopover} from './BatchCreateWorksDialog';

type PropsT = {
  +dispatch: (ReleaseRelationshipEditorActionT) => void,
  +recordingSelectionCount: number,
  +workSelectionCount: number,
};

type BatchAddRelationshipButtonPopoverPropsT = {
  +batchSelectionCount: number,
  +buttonContent: string,
  +dispatch: (ReleaseRelationshipEditorActionT) => void,
  +entityPlaceholder: string,
  +popoverId: string,
  +sourceType: CoreEntityTypeT,
};

const BatchAddRelationshipButtonPopover = ({
  batchSelectionCount,
  buttonContent,
  dispatch,
  entityPlaceholder,
  popoverId,
  sourceType,
}: BatchAddRelationshipButtonPopoverPropsT) => {
  const [isOpen, setOpen] = React.useState(false);
  const addButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const buildPopoverContent = useAddRelationshipDialogContent({
    batchSelectionCount,
    defaultTargetType: null,
    dispatch,
    source: createCoreEntityObject(sourceType, {
      name: entityPlaceholder,
    }),
    title: l('Add Relationship'),
  });

  return (
    <ButtonPopover
      buildChildren={buildPopoverContent}
      buttonContent={buttonContent}
      buttonProps={{
        className: 'add-item with-label',
      }}
      buttonRef={addButtonRef}
      className="relationship-dialog"
      id={popoverId}
      isDisabled={batchSelectionCount === 0}
      isOpen={isOpen}
      toggle={setOpen}
    />
  );
};

const RelationshipEditorBatchTools = (React.memo<PropsT>(({
  dispatch,
  recordingSelectionCount,
  workSelectionCount,
}: PropsT): React.Element<'table'> => {
  return (
    <table id="batch-tools">
      <tbody>
        <tr>
          <td>
            <BatchAddRelationshipButtonPopover
              batchSelectionCount={recordingSelectionCount}
              buttonContent={l('Batch-add a relationship to recordings')}
              dispatch={dispatch}
              entityPlaceholder={l('[selected recording]')}
              popoverId="batch-add-recording-relationship-dialog"
              sourceType="recording"
            />
          </td>
          <td>
            <BatchCreateWorksButtonPopover
              dispatch={dispatch}
              isDisabled={recordingSelectionCount === 0}
            />
          </td>
          <td>
            <BatchAddRelationshipButtonPopover
              batchSelectionCount={workSelectionCount}
              buttonContent={l('Batch-add a relationship to works')}
              dispatch={dispatch}
              entityPlaceholder={l('[selected work]')}
              popoverId="batch-add-work-relationship-dialog"
              sourceType="work"
            />
          </td>
        </tr>
      </tbody>
    </table>
  );
}): React.AbstractComponent<PropsT>);

export default RelationshipEditorBatchTools;
