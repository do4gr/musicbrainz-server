/*
 * @flow strict-local
 * Copyright (C) 2020 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import Layout from '../../layout';

type Props = {
  +type: LinkTypeT,
};

const RelationshipTypeInUse = ({
  type,
}: Props): React.Element<typeof Layout> => (
  <Layout fullWidth title={l('Relationship Type In Use')}>
    <div className="content">
      <h1>{l('Relationship Type In Use')}</h1>
      <p>
        {texp.l(
          `The relationship type "{type}" can’t be deleted
           because it’s still in use.`,
          {type: type.name},
        )}
      </p>
    </div>
  </Layout>
);

export default RelationshipTypeInUse;
