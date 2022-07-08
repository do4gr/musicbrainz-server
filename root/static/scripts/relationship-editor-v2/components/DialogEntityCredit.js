/*
 * @flow strict-local
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import {ENTITY_NAMES} from '../../common/constants';
// $FlowIgnore[untyped-import]
import HelpIcon from '../../edit/components/HelpIcon';
import {stripAttributes} from '../../edit/utility/linkPhrase';
import type {
  DialogEntityCreditStateT,
} from '../types';
import type {
  DialogEntityCreditActionT,
} from '../types/actions';

type PropsT = {
  +backward: boolean,
  +dispatch: (DialogEntityCreditActionT) => void,
  +entityName: string,
  +linkType: LinkTypeT | null,
  +state: $ReadOnly<{...DialogEntityCreditStateT, ...}>,
  +targetType: CoreEntityTypeT,
};

export function createInitialState(
  creditedAs: string,
): DialogEntityCreditStateT {
  return {
    creditedAs,
    creditsToChange: '',
  };
}

export function reducer<T: $ReadOnly<{...DialogEntityCreditStateT, ...}>>(
  state: T,
  action: DialogEntityCreditActionT,
): T {
  const newState: {...T, ...} = {...state};

  switch (action.type) {
    case 'set-credit': {
      newState.creditedAs = action.creditedAs;
      break;
    }
    case 'set-credits-to-change': {
      newState.creditsToChange = action.value;
      break;
    }
    default: {
      /*:: exhaustive(action); */
      invariant(false);
    }
  }

  return newState;
}

const DialogEntityCredit = (React.memo<PropsT, void>(({
  backward,
  dispatch,
  entityName,
  linkType,
  state,
  targetType,
}: PropsT): React.MixedElement => {
  const creditedAsOrName = state.creditedAs || entityName;
  const origCredit = React.useRef(creditedAsOrName);

  function handleCreditedAsChange(event) {
    dispatch({
      creditedAs: event.target.value,
      type: 'set-credit',
    });
  }

  function handleChangeCreditsChecked(event) {
    dispatch({
      type: 'set-credits-to-change',
      value: event.target.checked ? 'all' : '',
    });
  }

  function handleChangedCreditsSelection(event) {
    dispatch({
      type: 'set-credits-to-change',
      value: event.target.value,
    });
  }

  const inputRef = React.useRef(null);
  const inputId = React.useId();

  let changeCreditsSection;
  if (
    state.creditsToChange ||
    creditedAsOrName !== origCredit.current ||
    creditedAsOrName !== entityName
  ) {
    changeCreditsSection = (
      <>
        <br />
        <label className="change-credits-checkbox">
          <input
            checked={!!state.creditsToChange}
            onChange={handleChangeCreditsChecked}
            type="checkbox"
          />
          <span>
            {exp.l(
              `Change credits for other {entity} relationships
                on the page.`,
              {entity: <bdi>{entityName}</bdi>},
            )}
          </span>
        </label>
        {state.creditsToChange ? (
          <div className="change-credits-radio-options">
            <label>
              <input
                checked={state.creditsToChange === 'all'}
                name="changed-credits"
                onChange={handleChangedCreditsSelection}
                type="radio"
                value="all"
              />
              {l('All of these relationships.')}
            </label>

            <label>
              <input
                checked={state.creditsToChange === 'same-entity-types'}
                name="changed-credits"
                onChange={handleChangedCreditsSelection}
                type="radio"
                value="same-entity-types"
              />
              <span>
                {texp.l('Only relationships to {entity_type} entities.', {
                  entity_type: ENTITY_NAMES[targetType](),
                })}
              </span>
            </label>

            {linkType ? (
              <label>
                <input
                  checked={
                    state.creditsToChange === 'same-relationship-type'}
                  name="changed-credits"
                  onChange={handleChangedCreditsSelection}
                  type="radio"
                  value="same-relationship-type"
                />
                <span>
                  {texp.l(
                    `Only “{relationship_type}” relationships to
                    {entity_type} entities.`,
                    {
                      entity_type: ENTITY_NAMES[targetType](),
                      relationship_type: stripAttributes(
                        linkType,
                        l_relationships(
                          backward
                            ? linkType.reverse_link_phrase
                            : linkType.link_phrase,
                        ),
                      ),
                    },
                  )}
                </span>
              </label>
            ) : null}
          </div>
        ) : null}
      </>
    );
  }

  return (
    <tr>
      <td className="section">
        <label
          className="credit-field"
          htmlFor={inputId}
        >
          {addColonText('Credited as')}
        </label>
      </td>
      <td className="fields">
        <input
          className="entity-credit"
          id={inputId}
          onChange={handleCreditedAsChange}
          placeholder={entityName}
          ref={inputRef}
          type="text"
          value={state.creditedAs}
        />
        <HelpIcon
          content={l(
            `A credited name is optional. You can leave this field blank
             to keep the current name.`,
          )}
        />
        {changeCreditsSection}
      </td>
    </tr>
  );
}): React.AbstractComponent<PropsT, void>);

export default DialogEntityCredit;
