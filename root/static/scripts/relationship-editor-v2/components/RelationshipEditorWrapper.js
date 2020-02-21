/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import hydrate from '../../../../utility/hydrate';
import {
  withLoadedTypeInfoForRelationshipEditor,
} from '../../edit/components/withLoadedTypeInfo';

import RelationshipEditor, {
  loadOrCreateInitialState,
  reducer,
  type InitialStateArgsT,
} from './RelationshipEditor';

/*
 * Wraps the relationship editor component to provide it with state and
 * hydration.
 *
 * TODO: Pass state/dispatch in from the edit form once that's written, and
 * perform hydration there. This component can then be removed.
 *
 * N.B. For series, use
 * root/static/scripts/series/components/SeriesRelationshipEditor.js instead.
 */

type PropsT = InitialStateArgsT;

let RelationshipEditorWrapper:
  React.AbstractComponent<PropsT, void> =
(props: PropsT) => {
  const [state, dispatch] = React.useReducer(
    reducer,
    props,
    loadOrCreateInitialState,
  );

  const nameFieldId = `id-${props.formName}.name`;
  const entityType = state.entity.entityType;

  React.useEffect(() => {
    const nameField = document.getElementById(nameFieldId);

    const handleNameChange = function (event: InputEvent) {
      dispatch({
        type: 'update-entity',
        entityType,
        changes: {
          // $FlowIgnore[prop-missing]
          name: event.target.value,
        },
      });
    };

    nameField?.addEventListener('input', handleNameChange);

    return function () {
      nameField?.removeEventListener('input', handleNameChange);
    };
  }, [nameFieldId, entityType]);

  return (
    <RelationshipEditor
      dispatch={dispatch}
      formName={props.formName}
      state={state}
    />
  );
};

RelationshipEditorWrapper =
  withLoadedTypeInfoForRelationshipEditor<PropsT, void>(
    RelationshipEditorWrapper,
  );

RelationshipEditorWrapper = hydrate<PropsT>(
  'div.relationship-editor',
  RelationshipEditorWrapper,
);

export default RelationshipEditorWrapper;
