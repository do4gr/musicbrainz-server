/*
 * Copyright (C) 2016 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import ko from 'knockout';
import {flushSync} from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

import '../../common/entity';
import MB from '../../common/MB';
import FieldErrors from '../../../../components/FieldErrors';
import FormRow from '../../../../components/FormRow';

import ArtistCreditEditor from './ArtistCreditEditor';

export const FormRowArtistCredit = ({form, entity, onChange}) => (
  <FormRow>
    <label className="required" htmlFor="entity-artist">
      {l('Artist:')}
    </label>
    <ArtistCreditEditor
      entity={entity}
      forLabel="entity-artist"
      form={form}
      hiddenInputs
      onChange={onChange}
    />
    {form ? <FieldErrors field={form.field.artist_credit} /> : null}
  </FormRow>
);

MB.initializeArtistCredit = function (form, initialArtistCredit) {
  const source = MB.getSourceEntityInstance();
  source.artistCredit = ko.observable(initialArtistCredit);

  let ignoreArtistCreditUpdate = false;
  const handleArtistCreditEditorUpdate = function (artistCredit) {
    ignoreArtistCreditUpdate = true;
    source.artistCredit(artistCredit);
    ignoreArtistCreditUpdate = false;
  };

  const container = document.getElementById('artist-credit-editor');
  const root = ReactDOMClient.createRoot(container);
  flushSync(() => {
    root.render(
      <FormRowArtistCredit
        entity={source}
        form={form}
        onChange={handleArtistCreditEditorUpdate}
      />,
    );
  });

  source.artistCredit.subscribe((artistCredit) => {
    if (ignoreArtistCreditUpdate) {
      return;
    }
    $('table.artist-credit-editor', container)
      .data('componentInst')
      .setState({artistCredit});
  });
};
