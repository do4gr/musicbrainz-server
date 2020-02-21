/*
 * @flow
 * Copyright (C) 2020 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import {
  getSourceEntityDataForRelationshipEditor,
} from './common/utility/catalyst';
import {createExternalLinksEditorForHtmlForm} from './edit/externalLinks';
import './relationship-editor-v2/components/RelationshipEditorWrapper';

const sourceData = getSourceEntityDataForRelationshipEditor();

createExternalLinksEditorForHtmlForm(
  'edit-' + sourceData.entityType.replace('_', '-'),
);
