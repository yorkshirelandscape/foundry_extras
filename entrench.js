main ();

async function main() {

//Is more than one token selected? If true, break.
    if( canvas.tokens.controlled.length == 0 ||  canvas.tokens.controlled.length > 1){
            ui.notifications.error("Please select a single token.");
            return;
        }

    let selected = _token;

//get allied tokens and embedded characters or embedding units (same grid position)
    let allies = canvas.tokens.placeables.filter(t => !t._controlled &&
                        t.data.disposition == selected.data.disposition );
    let eAllies = allies.reduce((acc, t) => {
        if(canvas.grid.measureDistance(selected, t) < 10 ) {
            acc.push(t);
        }
        return acc;
    },[]);
    
//Is the selected token a military unit? If false, select embedding unit. If unavailable, break.
    if( !selected.name.includes('Infantry') && !selected.name.includes('Cavalry') ) {
        if( eAllies.length == 1 ) { 
                eAllies[0].toggleEffect('icons/svg/tower.svg');
            } else {
                ui.notifications.error('Select a military unit, not a character.');
                return;}
    } else {
        _token.toggleEffect('icons/svg/tower.svg');
    }
}
