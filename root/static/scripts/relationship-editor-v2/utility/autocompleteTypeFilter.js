/*
 * @flow strict
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import type {
  ItemT as AutocompleteItemT,
} from '../../common/components/Autocomplete2/types';
import {unaccent} from '../../common/utility/strings';

export default function autocompleteTypeFilter(
  item: AutocompleteItemT<LinkAttrTypeT | LinkTypeT>,
  searchTerm: string,
): boolean {
  if (item.type === 'option') {
    const entity = item.entity;
    const lowerSearchTerm = unaccent(searchTerm).toLowerCase();
    return (entity.l_name_normalized ?? '').includes(lowerSearchTerm);
  }
  return true;
}
