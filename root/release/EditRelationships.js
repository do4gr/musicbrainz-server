/*
 * @flow strict-local
 * Copyright (C) 2021 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as React from 'react';

import Layout from '../layout/index';
import manifest from '../static/manifest';
import ReleaseRelationshipEditor
  from '../static/scripts/release/components/ReleaseRelationshipEditor';

import ReleaseHeader from './ReleaseHeader';

type PropsT = {
  +$c: CatalystContextT,
};

const EditRelationships = ({
  $c,
}: PropsT): React.Element<typeof Layout> => {
  const release = $c.stash.source_entity;
  invariant(release?.entityType === 'release');

  return (
    <Layout
      fullWidth
      title={texp.l('Edit Relationships: {release}', {release: release.name})}
    >
      <div className="rel-editor" id="content">
        <ReleaseHeader page="edit-relationships" release={release} />

        <p>
          {l(
            `To use the batch tools, select some recordings or works using
             the checkboxes.`,
          )}
        </p>

        <p>
          {exp.l(
            `Please read {relationships_doc|our guidelines for relationships}
             if you haven’t already.`,
            {
              relationships_doc: {
                href: '/doc/Style/Relationships',
                target: '_blank',
              },
            },
          )}
        </p>

        <ReleaseRelationshipEditor />
      </div>

      {manifest.js('release/edit-relationships', {async: 'async'})}
    </Layout>
  );
};

export default EditRelationships;
