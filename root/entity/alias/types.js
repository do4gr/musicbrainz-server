/*
 * @flow strict
 * Copyright (C) 2019 Anirudh Jain
 *
 * This file is part of MusicBrainz, the open internet music database,
 * and is licensed under the GPL version 2, or (at your option) any
 * later version: http://www.gnu.org/licenses/gpl-2.0.txt
 */

export type AliasEditFormT = FormT<{
  +edit_note: ReadOnlyFieldT<string>,
  +locale: ReadOnlyFieldT<string>,
  +make_votable: ReadOnlyFieldT<boolean>,
  +name: ReadOnlyFieldT<string>,
  +period: DatePeriodFieldT,
  +primary_for_locale: ReadOnlyFieldT<boolean>,
  +sort_name: ReadOnlyFieldT<string>,
  +type_id: ReadOnlyFieldT<string>,
}>;

export type WritableAliasEditFormT = FormT<{
  +edit_note: FieldT<string>,
  +locale: FieldT<string>,
  +make_votable: FieldT<boolean>,
  +name: FieldT<string>,
  +period: WritableDatePeriodFieldT,
  +primary_for_locale: FieldT<boolean>,
  +sort_name: FieldT<string>,
  +type_id: FieldT<string>,
}>;
