const base = prompt('Enter the base level of the scenario:', 1 );

const party = game.actors.party.members.filter((c) => c.type === 'character' && !['Animal Companion','Eidolon','Construct Companion'].includes(c.class?.name));

const levels = party.map((c) => c.system.details.level.value - base );

const points = levels.map((l) => { 
    if (l === 3) {
        return 6
    } else { 
        return l + 2 
    }
});

const cp = points.reduce((acc, p) => acc + p, 0 );

const size = party.length;

let tier = '';
if ( cp >= 19 ) {
    tier = 'HT';
} else if ( cp <= 15 ) {
    tier = 'LT';
} else if ( size <= 4 ){
    tier = 'HT'
} else {
    tier = 'LT';
}


ui.notifications.info(`CP: ${cp} ${tier}`);
