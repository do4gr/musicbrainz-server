/*
 * @flow strict-local
 * Copyright (C) 2021 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import {
  createInitialState as createAutocompleteState,
} from '../../common/components/Autocomplete2';
import type {
  ItemT as AutocompleteItemT,
} from '../../common/components/Autocomplete2/types';
import {
  LANGUAGE_ZXX_ID,
} from '../../common/constants';
import {compare} from '../../common/i18n';
import linkedEntities from '../../common/linkedEntities';
import {uniqueId} from '../../common/utility/numbers';
import Multiselect, {
  type MultiselectActionT,
  type MultiselectPropsT,
  runReducer as runMultiselectReducer,
} from '../../edit/components/Multiselect';
import type {
  MultiselectLanguageStateT,
  MultiselectLanguageValueStateT,
} from '../../relationship-editor-v2/types';

export function createInitialState(
  initialLanguages?: $ReadOnlyArray<LanguageT>,
): MultiselectLanguageStateT {
  const languages: Array<LanguageT> =
    // $FlowIgnore[incompatible-type]
    Object.values(linkedEntities.language);

  languages.sort((a, b) => (
    (a.id === LANGUAGE_ZXX_ID ? 0 : 1) - (b.id === LANGUAGE_ZXX_ID ? 0 : 1) ||
    (b.frequency - a.frequency) ||
    compare(a.name, b.name)
  ));

  const languageOptions = languages.map(language => {
    const displayName = language.iso_code_3 === 'zxx'
      ? l('[No lyrics]')
      : l_languages(language.name);

    /*
     * XXX: Autocomplete2 doesn't use item.name for some reason, so we have
     * to overwrite it on the language entity.
     */
    // $FlowIgnore[cannot-write]
    language.name = displayName;

    return {
      entity: language,
      id: language.id,
      name: displayName,
      type: 'option',
    };
  });

  const newState = {
    max: null,
    staticItems: languageOptions,
    values: [],
  };
  if (initialLanguages?.length) {
    for (const language of initialLanguages) {
      newState.values.push(
        createSelectedLanguageValue(newState.staticItems, language),
      );
    }
  } else {
    newState.values.push(createEmptyLanguageValue(newState));
  }
  return newState;
}

export function createSelectedLanguageValue(
  staticItems: $ReadOnlyArray<AutocompleteItemT<LanguageT>>,
  selectedLanguage: LanguageT | null,
): MultiselectLanguageValueStateT {
  const key = uniqueId();
  return {
    autocomplete: createAutocompleteState<LanguageT>({
      entityType: 'language',
      id: 'lyrics-language-' + String(key),
      placeholder: l('Add lyrics language'),
      recentItemsKey: 'language-lyrics',
      selectedEntity: selectedLanguage,
      staticItems,
    }),
    key,
    removed: false,
  };
}

export function createEmptyLanguageValue(
  newState: {...MultiselectLanguageStateT},
): MultiselectLanguageValueStateT {
  return createSelectedLanguageValue(newState.staticItems, null);
}

export function runReducer(
  newState: {...MultiselectLanguageStateT},
  action: MultiselectActionT<LanguageT>,
): void {
  return runMultiselectReducer(
    newState,
    action,
    createEmptyLanguageValue,
  );
}

type WorkLanguageMultiselectPropsT = {
  +dispatch: (MultiselectActionT<LanguageT>) => void,
  +state: MultiselectLanguageStateT,
};

// XXX: https://github.com/facebook/flow/issues/7672
const LanguageMultiselect = (
  // $FlowIgnore
  Multiselect:
    React.AbstractComponent<
      MultiselectPropsT<
        LanguageT,
        MultiselectLanguageValueStateT,
        MultiselectLanguageStateT,
      >,
      mixed,
    >
);

const WorkLanguageMultiselect: React$AbstractComponent<
  WorkLanguageMultiselectPropsT,
  mixed,
> = React.memo<
  WorkLanguageMultiselectPropsT,
>(({
  dispatch,
  state,
}: WorkLanguageMultiselectPropsT): React.MixedElement => (
  <tr>
    <td className="section">
      {addColonText(l('Lyrics Languages'))}
    </td>
    <td>
      <LanguageMultiselect
        addLabel={l('Add lyrics language')}
        dispatch={dispatch}
        state={state}
      />
    </td>
  </tr>
));

export default WorkLanguageMultiselect;
