/*
 * Copyright (C) 2015 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import $ from 'jquery';
import ko from 'knockout';
import {flushSync} from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';

import MB from '../common/MB';
import {sortByNumber} from '../common/utility/arrays';
import clean from '../common/utility/clean';
import debounce from '../common/utility/debounce';
import isBlank from '../common/utility/isBlank';
import request from '../common/utility/request';
import {unaccent} from '../common/utility/strings';

import PossibleDuplicates from './components/PossibleDuplicates';
import * as validation from './validation';

var commentRequired = ko.observable(false);
var commentEmpty = ko.observable(false);

validation.errorField(ko.computed(function () {
  return commentRequired() && commentEmpty();
}));

var needsConfirmation = ko.observable(false);
var isConfirmed = ko.observable(false);

validation.errorField(ko.computed(function () {
  return needsConfirmation() && !isConfirmed();
}));

var requestPending = validation.errorField(ko.observable(false));

function renderDuplicates(name, duplicates, dupeRoot) {
  needsConfirmation(true);

  flushSync(() => {
    dupeRoot.render(
      <PossibleDuplicates
        duplicates={duplicates}
        name={name}
        onCheckboxChange={event => isConfirmed(event.target.checked)}
      />,
    );
  });
}

function unmountDuplicates(dupeRoot) {
  needsConfirmation(false);
  flushSync(() => {
    dupeRoot.render(null);
  });
}

function sortPlaceDuplicates(duplicates) {
  var selectedArea = ko.unwrap(getSelectedArea()) || {};

  function sharesLevel(area, level) {
    return (
      (area[`parent_${level}`] || area).gid ===
      (selectedArea[`parent_${level}`] || selectedArea).gid
    );
  }

  return sortByNumber(duplicates, function (dupe) {
    var area = dupe.area;

    if (!area) {
      return 0;
    }

    if (area.gid === selectedArea.gid) {
      return 1;
    }

    if (area.name === selectedArea.name) {
      return 2;
    }

    if (sharesLevel(area, 'city')) {
      return 3;
    }

    if (sharesLevel(area, 'subdivision')) {
      return 4;
    }

    if (sharesLevel(area, 'country')) {
      return 5;
    }

    return 6;
  });
}

function sortDuplicates(type, duplicates) {
  if (type === 'place') {
    return sortPlaceDuplicates(duplicates);
  }

  return duplicates;
}

function getSelectedArea() {
  return $('span.area.autocomplete > input.name')
    .data('mb-entitylookup').currentSelection;
}

function isPlaceCommentRequired(duplicates) {
  var selectedArea = ko.unwrap(getSelectedArea()) || {};

  /*
   * We require a disambiguation comment if no area is given, or if there
   * is a possible duplicate in the same area or lacking area information.
   */
  if (!selectedArea.gid) {
    return true;
  }

  return duplicates.some(function (place) {
    return !place.area || place.area.gid === selectedArea.gid;
  });
}

const normalizeName = name => unaccent(name).toUpperCase();

function isCommentRequired(type, name, duplicates) {
  if (type === 'place') {
    return isPlaceCommentRequired(duplicates);
  }

  const normalizedName = normalizeName(name);

  return duplicates.some(function (duplicate) {
    return normalizedName === normalizeName(duplicate.name);
  });
}

function markCommentAsRequired(input) {
  commentRequired(true);

  var $parent = $(input)
    .attr('required', 'required')
    .addClass('error')
    .parent();

  if (!$parent.next('div.comment-required').length) {
    $parent.after($('<div>').addClass('no-label error comment-required')
      .text(l('Required field.')));
  }
}

function markCommentAsNotRequired(input) {
  commentRequired(false);

  $(input)
    .removeAttr('required')
    .removeClass('error')
    .parent()
    .next('div.comment-required')
    .remove();
}

MB.initializeDuplicateChecker = function (type) {
  var nameInput = document.getElementById(`id-edit-${type}.name`);
  var commentInput = document.getElementById(`id-edit-${type}.comment`);
  var dupeContainer = document.getElementById('possible-duplicates');
  var dupeRoot = ReactDOMClient.createRoot(dupeContainer);
  var currentName = nameInput.value;
  var originalName = currentName;
  var currentDuplicates = [];
  var promise;

  const mbidLocationMatch = window.location.pathname.match(
    /[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/,
  );
  const sourceEntityGID = mbidLocationMatch ? mbidLocationMatch[0] : '';

  function makeRequest(name, forceRequest) {
    var nameChanged = name !== originalName;

    /*
     * forceRequest only applies if name is non-empty.
     * we should never check for duplicates of an existing entity,
     * if the name hasn't changed.
     */
    if (isBlank(name) || !(nameChanged || forceRequest) ||
        (sourceEntityGID && !nameChanged)) {
      unmountDuplicates(dupeRoot);
      markCommentAsNotRequired(commentInput);
      return;
    }

    requestPending(true);
    promise = request({
      url: '/ws/js/check_duplicates',
      data: $.param({type: type, name: name, mbid: sourceEntityGID}, true),
    })
      .done(function (data) {
        var duplicates = sortDuplicates(type, data.duplicates);

        if (duplicates.length) {
          renderDuplicates(name, duplicates, dupeRoot);

          if (isBlank(commentInput.value) &&
              isCommentRequired(type, name, duplicates)) {
            markCommentAsRequired(commentInput);
          } else {
            markCommentAsNotRequired(commentInput);
          }
        } else {
          unmountDuplicates(dupeRoot);
          markCommentAsNotRequired(commentInput);
        }

        currentDuplicates = duplicates;
      })
      .fail(function (jqXHR) {
        if (/^50/.test(jqXHR.status)) {
          setTimeout((...args) => makeRequest(name, false, ...args), 3000);
        }
      })
      .always(function () {
        promise = null;
        requestPending(false);
      });
  }

  function normalize(name) {
    return clean(name).toLowerCase();
  }

  var handleNameChange = debounce(function (name, forceRequest) {
    if (forceRequest || normalize(name) !== normalize(currentName)) {
      if (promise) {
        promise.abort();
      }
      makeRequest(name, forceRequest);
      currentName = name;
    }
  }, 300);

  /*
   * Initiate the duplicate checker on the existing name, which may have been
   * seeded via query parameters.
   */
  handleNameChange(currentName, true);
  $(nameInput).on('input', function () {
    handleNameChange(this.value, false);
  });

  function checkForEmptyComment() {
    commentEmpty(isBlank(this.value));
  }

  checkForEmptyComment.call(commentInput);
  $(commentInput).on('input', checkForEmptyComment);

  if (type === 'place') {
    getSelectedArea().subscribe(function () {
      if (currentDuplicates.length &&
          isPlaceCommentRequired(currentDuplicates)) {
        markCommentAsRequired(commentInput);
      } else {
        markCommentAsNotRequired(commentInput);
      }
    });
  }
};

export default MB.initializeDuplicateChecker;
