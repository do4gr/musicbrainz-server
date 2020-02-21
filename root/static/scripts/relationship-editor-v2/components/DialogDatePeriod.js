/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import FieldErrors, {
  FieldErrorsList,
} from '../../../../components/FieldErrors';
import FormRowCheckbox from '../../../../components/FormRowCheckbox';
import PartialDateInput from '../../common/components/PartialDateInput';
import isDateEmpty from '../../common/utility/isDateEmpty';
import type {
  ActionT,
  StateT,
} from '../../edit/components/DateRangeFieldset';
import {partialDateFromField} from '../../edit/components/DateRangeFieldset';
import useDateRangeFieldset from '../../edit/hooks/useDateRangeFieldset';

type PropsT = {
  +dispatch: (ActionT) => void,
  +state: StateT,
};

const DialogDatePeriod = (React.memo<PropsT>(({
  dispatch,
  state,
}: PropsT): React.MixedElement | null => {
  const hooks = useDateRangeFieldset(dispatch);

  const beginDateField = state.field.begin_date;
  const endDateField = state.field.end_date;
  const endDate = partialDateFromField(endDateField);

  return (
    <>
      <tr>
        <td className="section">
          <label htmlFor={'id-' + beginDateField.field.year.html_name}>
            {addColonText(l('Begin date'))}
          </label>
        </td>
        <td className="fields">
          <PartialDateInput
            dispatch={hooks.beginDateDispatch}
            field={beginDateField}
            yearInputRef={hooks.beginYearInputRef}
          />
          <button
            className="icon copy-date"
            onClick={hooks.handleDateCopy}
            title={l('Copy date')}
            type="button"
          />
          <FieldErrors field={beginDateField} />
        </td>
      </tr>
      <tr>
        <td className="section">
          <label htmlFor={'id-' + endDateField.field.year.html_name}>
            {addColonText(l('End date'))}
          </label>
        </td>
        <td className="fields">
          <PartialDateInput
            dispatch={hooks.endDateDispatch}
            field={state.field.end_date}
            yearInputRef={hooks.endYearInputRef}
          />
          <FieldErrors field={state.field.end_date} />
          <br />
          <FormRowCheckbox
            disabled={!isDateEmpty(endDate)}
            field={state.field.ended}
            label={l('This relationship has ended.')}
            onChange={hooks.handleEndedChange}
          />
          <FieldErrorsList
            errors={state.errors}
            hasHtmlErrors={false}
          />
        </td>
      </tr>
    </>
  );
}): React.AbstractComponent<PropsT>);

export default DialogDatePeriod;
