/*
 * @flow strict
 * Copyright (C) 2022 MetaBrainz Foundation
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

import * as tree from 'weight-balanced-tree';

import type {
  ItemT as AutocompleteItemT,
  StateT as AutocompleteStateT,
} from '../common/components/Autocomplete2/types';
import type {LazyReleaseStateT} from '../release/types';

import type {RelationshipEditStatusT} from './constants';

export type CreditChangeOptionT =
  | ''
  | 'all'
  | 'same-entity-types'
  | 'same-relationship-type';

export type RelationshipStateForTypesT<
  +T0: CoreEntityT,
  +T1: CoreEntityT,
> = {
  +_original: RelationshipStateT | null,
  +_status: RelationshipEditStatusT,
  +attributes: tree.ImmutableTree<LinkAttrT> | null,
  +begin_date: PartialDateT | null,
  +editsPending: boolean,
  +end_date: PartialDateT | null,
  +ended: boolean,
  +entity0: T0,
  +entity0_credit: string,
  +entity1: T1,
  +entity1_credit: string,
  +id: number,
  +linkOrder: number,
  +linkTypeID: number | null,
};

export type RelationshipStateT =
  RelationshipStateForTypesT<CoreEntityT, CoreEntityT>;

export type RelationshipPhraseGroupT = {
  +key: string,
  +relationships: tree.ImmutableTree<RelationshipStateT> | null,
  +textPhrase: string,
};

export type RelationshipLinkTypeGroupT = {
  +backward: boolean,
  +phraseGroups: tree.ImmutableTree<RelationshipPhraseGroupT> | null,
  // Null types are represented by 0.
  +typeId: number,
};

export type RelationshipLinkTypeGroupKeyT = {
  +backward: boolean,
  +typeId: number,
};

export type RelationshipLinkTypeGroupsT =
  tree.ImmutableTree<RelationshipLinkTypeGroupT> | null;

export type RelationshipTargetTypeGroupT =
  [CoreEntityTypeT, RelationshipLinkTypeGroupsT];

export type RelationshipTargetTypeGroupsT =
  tree.ImmutableTree<RelationshipTargetTypeGroupT> | null;

export type RelationshipSourceGroupT =
  [CoreEntityT, RelationshipTargetTypeGroupsT];

export type RelationshipSourceGroupsT =
  tree.ImmutableTree<RelationshipSourceGroupT> | null;

export type NonReleaseCoreEntityT =
  | AreaT
  | ArtistT
  | EventT
  | GenreT
  | InstrumentT
  | LabelT
  | PlaceT
  | RecordingT
  | ReleaseGroupT
  | SeriesT
  | UrlT
  | WorkT;

export type NonReleaseCoreEntityTypeT =
  NonReleaseCoreEntityT['entityType'];

export type RelationshipEditorStateT = {
  +entity: NonReleaseCoreEntityT,
  // existing = relationships that exist in the database
  +existingRelationshipsBySource: RelationshipSourceGroupsT,
  +reducerError: Error | null,
  +relationshipsBySource: RelationshipSourceGroupsT,
};

export type SeededRelationshipT = $ReadOnly<{
  ...RelationshipT,
  +entity0_id: number | null,
  +entity1_id: number | null,
  +id: null,
  +linkTypeID: number | null,
}>;

export type RelationshipDialogStateT = {
  +attributes: DialogAttributesStateT,
  +backward: boolean,
  +datePeriodField: DatePeriodFieldT,
  +linkType: DialogLinkTypeStateT,
  +resultingDatePeriod: DatePeriodRoleT,
  +sourceEntity: DialogSourceEntityStateT,
  +targetEntity: DialogTargetEntityStateT,
};

export type DialogBooleanAttributeStateT = $ReadOnly<{
  ...DialogLinkAttributeStateT,
  +control: 'checkbox',
  +enabled: boolean,
}>;

export type DialogMultiselectAttributeStateT = $ReadOnly<{
  ...DialogLinkAttributeStateT,
  +control: 'multiselect',
  +linkType: LinkTypeT,
  +values: $ReadOnlyArray<DialogMultiselectAttributeValueStateT>,
}>;

export type DialogMultiselectAttributeValueStateT = {
  +autocomplete: AutocompleteStateT<LinkAttrTypeT>,
  +control: 'multiselect-value',
  +creditedAs?: string,
  +error?: string,
  +key: number,
  +removed: boolean,
};

export type DialogTextAttributeStateT = $ReadOnly<{
  ...DialogLinkAttributeStateT,
  +control: 'text',
  +textValue: string,
}>;

export type DialogAttributeT =
  | DialogBooleanAttributeStateT
  | DialogMultiselectAttributeStateT
  | DialogTextAttributeStateT;

export type DialogAttributesT = $ReadOnlyArray<DialogAttributeT>;

export type DialogAttributesStateT = {
  +attributesList: DialogAttributesT,
  +resultingLinkAttributes: tree.ImmutableTree<LinkAttrT> | null,
};

export type DialogLinkAttributeStateT = {
  creditedAs?: string,
  error: string,
  key: number,
  max: number | null,
  min: number | null,
  textValue?: string,
  type: LinkAttrTypeT,
};

export type DialogLinkTypeStateT = {
  +autocomplete: AutocompleteStateT<LinkTypeT>,
  +error: React$Node,
};

export type DialogSourceEntityStateT = $ReadOnly<{
  ...DialogEntityCreditStateT,
  +entityType: CoreEntityTypeT,
  +error: React$Node,
}>;

export type TargetTypeOptionT = {
  +text: string,
  +value: CoreEntityTypeT,
};

export type TargetTypeOptionsT = $ReadOnlyArray<TargetTypeOptionT>;

export type DialogTargetEntityStateT = $ReadOnly<{
  ...DialogEntityCreditStateT,
  +allowedTypes: TargetTypeOptionsT | null,
  +autocomplete: AutocompleteStateT<NonUrlCoreEntityT> | null,
  +error: string,
  +relationshipId: number,
  +target: CoreEntityT,
  +targetType: CoreEntityTypeT,
}>;

export type DialogEntityCreditStateT = {
  +creditedAs: string,
  +creditsToChange: CreditChangeOptionT,
};

export type LinkAttributeShapeT = {
  +credited_as?: string,
  +text_value?: string,
  +type: LinkAttrTypeT | null,
  ...
};

export type LinkAttributesByRootIdT =
  Map<number, Array<LinkAttributeShapeT>>;

export type BatchCreateWorksDialogStateT = {
  +attributes: DialogAttributesStateT,
  +languages: MultiselectLanguageStateT,
  +linkType: DialogLinkTypeStateT,
  +workType: number | null,
};

export type EditWorkDialogStateT = {
  +languages: MultiselectLanguageStateT,
  +name: string,
  +workType: number | null,
};

export type MultiselectLanguageValueStateT = {
  +autocomplete: AutocompleteStateT<LanguageT>,
  +key: number,
  +removed: boolean,
};

export type MultiselectLanguageStateT = {
  +max: number | null,
  +staticItems: $ReadOnlyArray<AutocompleteItemT<LanguageT>>,
  +values: $ReadOnlyArray<MultiselectLanguageValueStateT>,
};

/*
 * Release relationship editor types
 */

export type ReleaseWithMediumsAndReleaseGroupT = $ReadOnly<{
  ...ReleaseWithMediumsT,
  +releaseGroup: ReleaseGroupT,
}>;

// Associates a recording ID with all of the medium IDs it appears on.
export type RecordingMediumsT = Map<number, Array<MediumWithRecordingsT>>;

// Associates a work with all of its recordings.
export type WorkRecordingsT = tree.ImmutableTree<[
  number,
  tree.ImmutableTree<RecordingT> | null,
]> | null;

export type MediumWorkStateT = {
  +isSelected: boolean,
  +targetTypeGroups: RelationshipTargetTypeGroupsT,
  +work: WorkT,
};

export type MediumWorkStateTreeT =
  tree.ImmutableTree<MediumWorkStateT> | null;

export type MediumRecordingStateT = {
  +isSelected: boolean,
  +recording: RecordingT,
  +relatedWorks: MediumWorkStateTreeT,
  +targetTypeGroups: RelationshipTargetTypeGroupsT,
};

export type MediumRecordingStateTreeT =
  tree.ImmutableTree<MediumRecordingStateT> | null;

export type MediumStateTreeT = tree.ImmutableTree<[
  MediumWithRecordingsT,
  MediumRecordingStateTreeT,
]> | null;

export type ReleaseRelationshipEditorStateT = {
  ...$Exact<LazyReleaseStateT>,
  ...$Exact<RelationshipEditorStateT>,
  +editNoteField: ReadOnlyFieldT<string>,
  +enterEditForm: ReadOnlyFormT<{
    +make_votable: ReadOnlyFieldT<boolean>,
  }>,
  +entity: ReleaseWithMediumsAndReleaseGroupT,
  +mediums: MediumStateTreeT,
  +mediumsByRecordingId: RecordingMediumsT,
  +selectedRecordings: tree.ImmutableTree<RecordingT> | null,
  +selectedWorks: tree.ImmutableTree<WorkT> | null,
  +submissionError: ?string,
  +submissionInProgress: boolean,
  +workRecordings: WorkRecordingsT,
};

export type RelationshipSourceGroupsContextT = {
  +existing: RelationshipSourceGroupsT,
  +pending: RelationshipSourceGroupsT,
};
