const party = game.actors.party.members.filter((c) => c.type === 'character' && !['Animal Companion', 'Eidolon', 'Construct Companion'].includes(c.class?.name));
const otherActors = game.actors.filter((a) => !game.actors.party.members.includes( a ) );
const gm = game.user.isGM ? game.user.id : 'foo';
const users = party.map((a) => game.users.get( Object.entries( a.ownership )
    .filter((r) => r[0] !== gm && r[0] !== 'default' && r[1] === 3 )
    .map((r) => r[0] )[0] ) )
    .filter((u) => !otherActors.find((p) => Object.keys( p.ownership ).includes( u.id ) ) );

for ( const a of game.actors.party.members ) { a.delete() }
for ( const u of users ) { u.delete() }

await game.actors.party.deleteEmbeddedDocuments("Item", [], { deleteAll: true });

await game.macros.filter((m) => !m.hasPlayerOwner && m.folder === null ).forEach((m) => m.delete() );
