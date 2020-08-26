/*
 * @flow strict-local
 * Copyright (C) 2017 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import RatingStars from '../../../components/RatingStars';
import EntityLink from '../../../static/scripts/common/components/EntityLink';

type Props = {
  +entity: RatableT,
  +heading?: string,
};

const SidebarRating = ({
  entity,
  heading,
}: Props): React.Element<typeof React.Fragment> => (
  <>
    <h2 className="rating">{nonEmpty(heading) ? heading : l('Rating')}</h2>
    <p>
      <RatingStars entity={entity} />
      {entity.rating_count > 0 ? (
        <>
          {' ('}
          <EntityLink
            content={l('see all ratings')}
            entity={entity}
            subPath="ratings"
          />
          {')'}
        </>
      ) : null}
    </p>
  </>
);

export default SidebarRating;
