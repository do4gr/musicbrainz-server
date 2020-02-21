/*
 * @flow strict-local
 * Copyright (C) 2021 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

// $FlowIgnore[untyped-import]
import $ from 'jquery';
import * as React from 'react';

import hydrate from '../../../../utility/hydrate';
import {
  withLoadedTypeInfoForRelationshipEditor,
} from '../../edit/components/withLoadedTypeInfo';
import {getUnicodeUrl} from '../../edit/externalLinks';
import RelationshipEditor, {
  loadOrCreateInitialState,
  reducer,
  type InitialStateArgsT,
} from '../../relationship-editor-v2/components/RelationshipEditor';

type PropsT = InitialStateArgsT;

let UrlRelationshipEditor:
  React.AbstractComponent<PropsT, void> =
(props: PropsT) => {
  const [state, dispatch] = React.useReducer(
    reducer,
    props,
    loadOrCreateInitialState,
  );

  const url = state.entity;

  /*:: invariant(url.entityType === 'url'); */

  React.useEffect(() => {
    const $urlControl = $('#id-edit-url\\.url');

    const handleUrlChange = function () {
      /* eslint-disable react/no-this-in-sfc */
      this.value = getUnicodeUrl(this.value);
      dispatch({
        changes: {name: this.value},
        entityType: 'url',
        type: 'update-entity',
      });
      /* eslint-enable react/no-this-in-sfc */
    };

    $urlControl.on('change', handleUrlChange);

    return () => {
      $urlControl.off('change', handleUrlChange);
    };
  }, [url]);

  return (
    <RelationshipEditor
      dispatch={dispatch}
      formName={props.formName}
      state={state}
    />
  );
};

UrlRelationshipEditor =
  withLoadedTypeInfoForRelationshipEditor<PropsT, void>(
    UrlRelationshipEditor,
  );

UrlRelationshipEditor = hydrate<PropsT>(
  'div.relationship-editor',
  UrlRelationshipEditor,
);

export default UrlRelationshipEditor;
