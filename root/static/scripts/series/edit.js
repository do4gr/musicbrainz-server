import $ from 'jquery';
import ko from 'knockout';

import {SERIES_ORDERING_TYPE_AUTOMATIC} from '../common/constants';
import '../common/entity';
import MB from '../common/MB';
import initializeDuplicateChecker from '../edit/check-duplicates';
import {createExternalLinksEditorForHtmlForm} from '../edit/externalLinks';

import './components/SeriesRelationshipEditor';

$(function () {
  var $type = $('#id-edit-series\\.type_id');
  var $orderingType = $('#id-edit-series\\.ordering_type_id');

  const series = MB.getSourceEntityInstance();
  series.orderingTypeID($orderingType.val());
  series.typeID($type.val());

  series.typeBubble = new MB.Control.BubbleDoc();

  series.typeBubble.canBeShown = function () {
    return nonEmpty($type.val());
  };

  series.orderingTypeBubble = new MB.Control.BubbleDoc();

  series.orderingTypeDescription = ko.computed(function () {
    return lp_attributes(
      MB.orderingTypesByID[series.orderingTypeID()].description,
      'series_ordering_type',
    );
  });

  ko.applyBindingsToNode($type[0], {
    value: series.typeID,
    controlsBubble: series.typeBubble,
  }, series);

  ko.applyBindingsToNode($orderingType[0], {
    value: series.orderingTypeID,
    controlsBubble: series.orderingTypeBubble,
  }, series);

  ko.applyBindings(series, $('#series-type-bubble')[0]);
  ko.applyBindings(series, $('#ordering-type-bubble')[0]);

  MB.Control.initializeGuessCase('series', 'id-edit-series');

  $orderingType.on('change', function () {
    series.orderingTypeID(+this.value);
  });

  initializeDuplicateChecker('series');

  createExternalLinksEditorForHtmlForm('edit-series');
});
