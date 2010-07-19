use strict;
use Test::More;
use Test::Moose;

BEGIN { use_ok 'MusicBrainz::Server::Edit::Work::DeleteAlias' }

use MusicBrainz::Server::Constants qw( $EDIT_WORK_DELETE_ALIAS );
use MusicBrainz::Server::Test;

my $c = MusicBrainz::Server::Test->create_test_context();
MusicBrainz::Server::Test->prepare_test_database($c, '+workalias');
MusicBrainz::Server::Test->prepare_raw_test_database($c);

my $alias = $c->model('Work')->alias->get_by_id(1);

my $edit = _create_edit();
isa_ok($edit, 'MusicBrainz::Server::Edit::Work::DeleteAlias');

my ($edits) = $c->model('Edit')->find({ work => 1 }, 10, 0);
is(@$edits, 1);
is($edits->[0]->id, $edit->id);

$c->model('Edit')->load_all($edit);
is($edit->display_data->{work}->id, 1);
is($edit->display_data->{alias}, 'Alias 1');

$alias = $c->model('Work')->alias->get_by_id(1);
is($alias->edits_pending, 1);

my $work = $c->model('Work')->get_by_id(1);
is($work->edits_pending, 1);

my $alias_set = $c->model('Work')->alias->find_by_entity_id(1);
is(@$alias_set, 2);

MusicBrainz::Server::Test::reject_edit($c, $edit);

my $alias_set = $c->model('Work')->alias->find_by_entity_id(1);
is(@$alias_set, 2);

$work = $c->model('Work')->get_by_id(1);
is($work->edits_pending, 0);

$alias = $c->model('Work')->alias->get_by_id(1);
ok(defined $alias);
is($alias->edits_pending, 0);

my $edit = _create_edit();
MusicBrainz::Server::Test::accept_edit($c, $edit);

$work = $c->model('Work')->get_by_id(1);
is($work->edits_pending, 0);

$alias = $c->model('Work')->alias->get_by_id(1);
ok(!defined $alias);

$alias_set = $c->model('Work')->alias->find_by_entity_id(1);
is(@$alias_set, 1);

done_testing;

sub _create_edit {
    return $c->model('Edit')->create(
        edit_type => $EDIT_WORK_DELETE_ALIAS,
        editor_id => 1,
        entity_id => 1,
        alias     => $alias,
    );
}
