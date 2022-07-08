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
import * as tree from 'weight-balanced-tree';

import hydrate from '../../../../utility/hydrate';
import {
  PART_OF_SERIES_LINK_TYPE_IDS,
} from '../../common/constants';
import linkedEntities from '../../common/linkedEntities';
import isBlank from '../../common/utility/isBlank';
import {
  withLoadedTypeInfoForRelationshipEditor,
} from '../../edit/components/withLoadedTypeInfo';
import RelationshipEditor, {
  loadOrCreateInitialState,
  reducer,
  type InitialStateArgsT,
} from '../../relationship-editor-v2/components/RelationshipEditor';
import {
  findLinkTypeGroup,
  findLinkTypeGroups,
  findTargetTypeGroups,
} from '../../relationship-editor-v2/utility/findState';

type PropsT = InitialStateArgsT;

function getSeriesType(typeId: number | null): SeriesTypeT | null {
  return typeId == null
    ? null
    : linkedEntities.series_type[String(typeId)];
}

let SeriesRelationshipEditor:
  React.AbstractComponent<PropsT, void> =
(props: PropsT) => {
  const [state, dispatch] = React.useReducer(
    reducer,
    props,
    loadOrCreateInitialState,
  );

  const series = state.entity;

  /*:: invariant(series.entityType === 'series'); */

  // $FlowIgnore[sketchy-null-string]
  const seriesType = React.useMemo(() => {
    return getSeriesType(series.typeID);
  }, [series.typeID]);

  const seriesItemTypeFromRelationships = React.useMemo(function () {
    for (const partOfSeriesLinkTypeId of PART_OF_SERIES_LINK_TYPE_IDS) {
      const partOfSeriesLinkType =
        linkedEntities.link_type[partOfSeriesLinkTypeId];
      const seriesItemType = partOfSeriesLinkType.type0 === 'series'
        ? partOfSeriesLinkType.type1
        : partOfSeriesLinkType.type0;
      const linkTypeGroup = findLinkTypeGroup(
        findLinkTypeGroups(
          findTargetTypeGroups(
            state.relationshipsBySource,
            series,
          ),
          series,
          seriesItemType,
        ),
        partOfSeriesLinkTypeId,
        /* backward = */ seriesItemType < 'series',
      );
      if (!linkTypeGroup) {
        continue;
      }
      for (const phraseGroup of tree.iterate(linkTypeGroup.phraseGroups)) {
        if (phraseGroup.relationships?.size) {
          return seriesItemType;
        }
      }
    }
    return null;
  }, [
    series,
    state.relationshipsBySource,
  ]);

  function handleSeriesTypeChange(event) {
    const typeIdValue: string = event.target.value;
    const typeId: number | null =
      isBlank(typeIdValue) ? null : (+typeIdValue);
    dispatch({
      changes: {typeID: typeId},
      entityType: 'series',
      type: 'update-entity',
    });
  }

  function updateAllowedTypes() {
    let allowedTypeIdValue;

    $('#id-edit-series\\.type_id > option').each(function (index, element) {
      if (isBlank(element.value)) {
        return;
      }
      const thisType = linkedEntities.series_type[element.value];
      if (
        seriesItemTypeFromRelationships == null ||
        thisType.item_entity_type === seriesItemTypeFromRelationships
      ) {
        if (
          seriesItemTypeFromRelationships != null &&
          allowedTypeIdValue == null
        ) {
          allowedTypeIdValue = element.value;
        }
        element.removeAttribute('disabled');
      } else {
        element.setAttribute('disabled', 'disabled');
      }
    });

    if (
      seriesType == null &&
      seriesItemTypeFromRelationships != null &&
      allowedTypeIdValue != null
    ) {
      $('#id-edit-series\\.type_id').val(allowedTypeIdValue).change();
    }
  }

  function handleOrderingTypeChange(event) {
    dispatch({
      changes: {orderingTypeID: +(event.target.value)},
      entityType: 'series',
      type: 'update-entity',
    });
  }

  React.useEffect(() => {
    $('#id-edit-series\\.type_id')
      .on('change', handleSeriesTypeChange);

    updateAllowedTypes();

    $('#id-edit-series\\.ordering_type_id')
      .on('change', handleOrderingTypeChange);

    return () => {
      $('#id-edit-series\\.type_id')
        .off('change', handleSeriesTypeChange);

      $('#id-edit-series\\.ordering_type_id')
        .off('change', handleOrderingTypeChange);
    };
  });

  return (
    <RelationshipEditor
      dispatch={dispatch}
      formName={props.formName}
      state={state}
    />
  );
};

SeriesRelationshipEditor =
  withLoadedTypeInfoForRelationshipEditor<PropsT, void>(
    SeriesRelationshipEditor,
  );

SeriesRelationshipEditor = hydrate<PropsT>(
  'div.relationship-editor',
  SeriesRelationshipEditor,
);

export default SeriesRelationshipEditor;
