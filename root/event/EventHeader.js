/*
 * @flow strict-local
 * Copyright (C) 2018 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import EntityHeader from '../components/EntityHeader';
import localizeTypeNameForEntity
  from '../static/scripts/common/i18n/localizeTypeNameForEntity';

type Props = {
  +event: EventT,
  +page: string,
};

const EventHeader = ({
  event,
  page,
}: Props): React.Element<typeof EntityHeader> => (
  <EntityHeader
    entity={event}
    headerClass="eventheader"
    page={page}
    subHeading={localizeTypeNameForEntity(event)}
  />
);

export default EventHeader;
