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
                selected = eAllies[0];
                eAllies = canvas.tokens.placeables.filter(t => t._controlled );
            } else {
                ui.notifications.error('Select a military unit, not a character.');
                return;}
    }

//get targets
    var target = [];
    game.user.targets.forEach(i => {
        let tActor = i.actor;
        target.push(tActor);
    });

//Is more than one target selected? If true, break.
    if(target.length == 0 || target.length > 1){
            ui.notifications.error("Please select a single target.");
            return;
        }

    let targeted = Array.from(game.user.targets)[0];    

//get hostiles and embedded characters or embedding units
    let hostiles = canvas.tokens.placeables.filter(t => !t._controlled &&
                        t.data.disposition == selected.data.disposition * -1 && 
                        ( t.name.includes('Infantry') || t.name.includes('Cavalry') )
                        );
    
    let eHostiles = hostiles.reduce((acc, t) => {
        if(canvas.grid.measureDistance(targeted, t) < 10 ) {
            acc.push(t);
        }
        return acc;
    },[]);
    
//Is the selected target a military unit? If false target embedding unit. If unavailable, break.
    if( !targeted.name.includes('Infantry') && !targeted.name.includes('Cavalry') ) {
        if( eHostiles.length == 1 ) { 
                targeted = eHostiles[0];
            } else {
                ui.notifications.error('Target a military unit, not a character.');
                return;}
    }

//get neighboring hostiles, non-targeted, and lengths
    let nHostiles = hostiles.reduce((acc, t) => {
        if(canvas.grid.measureDistance(selected, t) < canvas.dimensions.distance ) {
            acc.push(t);
        }
        return acc;
    },[]);
    let ntHostiles = nHostiles.filter(t => t.id != targeted.id);
    let nhCount = nHostiles.length;
    let nthCount = ntHostiles.length;

//determine appropriate modifiers of embedded characters and their values
    let eType = ''; 
    let eAttMod = 0;
    let eDamMod = 0;
    
    if ( eAllies.length > 0 ) {
    eType = ( eAllies[0].actor.data.data.abilities.int.mod < 0 ? 'monster' : 'npc' );
    eAttMod = ( eType == 'monster' ? eAllies[0].actor.data.data.abilities.dex.mod : ( eAllies[0].actor.data.data.abilities.int.mod > eAllies[0].actor.data.data.abilities.wis.mod ? eAllies[0].actor.data.data.abilities.int.mod : eAllies[0].actor.data.data.abilities.wis.mod ) );
    eDamMod = ( eType == 'monster' ? eAllies[0].actor.data.data.abilities.str.mod : eAllies[0].actor.data.data.abilities.cha.mod ); } 

//get neighboring allies    
    let nAllies = allies.reduce((acc, t) => {
        if( canvas.grid.measureDistance(targeted, t) < canvas.dimensions.distance ) {
            acc.push(t);
        }
        return acc;
    },[]);

//get their distances from each other and if they're two hexes apart, flanking = true    
    let naDistCheck = [];
    nAllies.forEach( ally => {
        naDistCheck.push(Math.ceil(canvas.grid.measureDistance(ally, selected) / 10 ) * 10 );
    });
    
    let flanking = naDistCheck.includes(canvas.dimensions.distance*1.75);

//get allies and embedded mods and values for target's counterattack
    let cAllies = canvas.tokens.placeables.filter(t => t.data.disposition == targeted.data.disposition );
    let ceAllies = cAllies.reduce((acc, t) => {
        if(canvas.grid.measureDistance(targeted, t) < 10 && !t.name.includes('Infantry') && !t.name.includes('Cavalry')) {
            acc.push(t);
        }
        return acc;
    },[]);

    let ceType = ''; 
    let ceAttMod = 0;
    let ceDamMod = 0;
    
    if ( ceAllies.length > 0 ) {
    ceType = ( ceAllies[0].actor.data.data.abilities.int.mod < 0 ? 'monster' : 'npc' );
    ceAttMod = ( ceType == 'monster' ? ceAllies[0].actor.data.data.abilities.dex.mod : ( ceAllies[0].actor.data.data.abilities.int.mod > ceAllies[0].actor.data.data.abilities.wis.mod ? ceAllies[0].actor.data.data.abilities.int.mod : ceAllies[0].actor.data.data.abilities.wis.mod ) );
    ceDamMod = ( ceType == 'monster' ? ceAllies[0].actor.data.data.abilities.str.mod : ceAllies[0].actor.data.data.abilities.cha.mod ); } 
    

//determine whether attack leaves or enters difficult terrain    
    let yLoc = {x: _token.center.x, y: _token.center.y};

    let leavingDifficult = canvas.terrain.cost(yLoc, {ignoreGrid: true}) > 1;
    
    let tLoc = {x: targeted.center.x, y: targeted.center.y};

    let enteringDifficult = canvas.terrain.cost(tLoc, {ignoreGrid: true}) > 1;
    
    let dt = leavingDifficult != enteringDifficult;
    

//figure out whether attack crosses a terrain wall. Walls must be unidirectional, pointing uphill, and have a height using Wall Height module. 
    let dir = {x: '', y: ''};
    let midPoint = {x: (_token.center.x + targeted.center.x)/2, y: (_token.center.y + targeted.center.y)/2};
    
    switch( Math.sign( _token.center.x - targeted.center.x ) ) { 
                    case 1 : dir.x = -1;
                        break;
                    case -1 : dir.x = 1;
                        break;
                    default : dir.x = 0 ;
    }
    
    switch( Math.sign( _token.center.y - targeted.center.y ) ) { 
                    case 1 : dir.y = -1;
                        break;
                    case -1 : dir.y = 1;
                        break;
                    default : dir.y = 0 ;
    }
    
    let testRay = new Ray({x: selected.center.x, y: selected.center.y}, {x: targeted.center.x, y: targeted.center.y});
    
    let crossWalls = [];
    canvas.walls.placeables.forEach( w => { 
            if( WallsLayer.testWall(testRay, w) ) {
                    crossWalls.push( w );
                }
            });
    
    let cWalls = [];
    crossWalls.forEach( w => {
            cWalls.push( {x1: w.coords[0], y1: w.coords[1], x2: w.coords[2], y2: w.coords[3], dir: w.data.dir, h: w.data.flags.wallHeight.wallHeightTop} );
    });
    
    let cWall = Array.from(cWalls)[0];
    
    let dirZ = '';
    if( typeof cWall != 'undefined' && cWall.h != 0 ) {
    if( cWall.x1 >= cWall.x2 && cWall.dir == 1 && dir.x == 1 ) { dirZ = -1 }
        else if( cWall.x1 >= cWall.x2 && cWall.dir == 1 && dir.x == -1 ) { dirZ = 1 }
        else if( cWall.x1 >= cWall.x2 && cWall.dir == 2 && dir.x == 1 ) { dirZ = 1 }
        else if( cWall.x1 >= cWall.x2 && cWall.dir == 2 && dir.x == -1 ) { dirZ = -1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 1 && dir.x == 1 ) { dirZ = 1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 1 && dir.x == -1 ) { dirZ = -1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 2 && dir.x == 1 ) { dirZ = -1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 2 && dir.x == -1 ) { dirZ = 1 }
        else { dirZ = 0 } }

//determine whether target is entrenched. This is set by another macro.
    let entrenched = targeted.data.effects.includes('icons/svg/tower.svg');

//roll dice for attack and counterattack. Calculate attack and damage values.    
    var diceroll = new Roll('1d20').roll();
    var rollResult = diceroll.total;
    var baseRoll = rollResult + 5 + ( flanking ? 2 : 0 ) - ( entrenched ? 2 : 0 ) - nthCount - ( dt ? 1 : 0 ) + dirZ*-1;
    var attack = baseRoll + selected.actor.data.data.abilities.dex.mod - targeted.actor.data.data.abilities.dex.mod + eAttMod;
    var damage = 0;
    if( attack >= targeted.actor.attributes.ac.value ) {
        damage = Math.round( (baseRoll + selected.actor.data.data.abilities.str.mod - targeted.actor.data.data.abilities.con.mod + eDamMod) * 5 * ( selected.actor.hitPoints.current * ( selected.name.includes('Cavalry') ? 2 : 1 ) / targeted.actor.hitPoints.current ) )};
    
    var cDiceroll = new Roll('1d20').roll();
    var cRollResult = cDiceroll.total;
    var cBaseRoll = cRollResult;
    var cAttack = cBaseRoll + targeted.actor.data.data.abilities.dex.mod - selected.actor.data.data.abilities.dex.mod + ceAttMod;
    var cDamage = 0;
    if( cAttack >= selected.actor.attributes.ac.value ) {
        cDamage = Math.round( (cBaseRoll + targeted.actor.data.data.abilities.str.mod - selected.actor.data.data.abilities.con.mod + ceDamMod) * 5 * ( targeted.actor.hitPoints.current / selected.actor.hitPoints.current * ( selected.name.includes('Cavalry') ? 2 : 1 ) ) )};

//populate content for ChatMessage    
    var messageContent = '<b>' + selected.name + '</b> rolled <b>' + attack + '</b> ' + ( attack >= targeted.actor.data.data.attributes.ac.value ? 'for <b>' + damage + '</b> damage. <br>' : 'and missed.' ) + '<br>' +
                            '<b>Roll (' + rollResult + '): </b> + <b>5</b> for attacking <br>' +
                                (flanking ? '&nbsp;&nbsp;&nbsp;+<b>2</b> for flanking <br>' : '' ) +
                                (entrenched ? '&nbsp;&nbsp;&nbsp;&ndash;<b>2</b> for entrenched target<br>' : '' ) +
                                ( nthCount > 0 ? '&nbsp;&nbsp;&nbsp;&ndash;<b>' + nthCount + '</b> for adjacent enemy units not targeted <br>' : '' ) +
                                ( dirZ != 0 ? '&nbsp;&nbsp;&nbsp;<b>' + ( dirZ == 1 ? '&ndash; 1' : '+ 1' ) + '</b> for attacking ' + ( dirZ == 1 ? 'uphill' : 'downhill' ) + '<br>' : '' ) +
                                ( dt ? '&nbsp;&nbsp;&nbsp;&ndash;<b>1</b> for ' + ( leavingDifficult ? 'leaving' : 'entering' ) + ' difficult terrain <br>' : '' ) +
                            '<b>Attack (' + attack + '): ' + baseRoll + '</b> + yDEX: <b>' + selected.actor.data.data.abilities.dex.mod +
                                '</b> &ndash; tDEX: <b>' + targeted.actor.data.data.abilities.dex.mod + '</b><br>' + 
                                ( eAllies.length > 0 ? '&nbsp;&nbsp;&nbsp;+ ' + ( eType == 'npc' ? ( eAllies[0].actor.data.data.abilities.int.mod > eAllies[0].actor.data.data.abilities.wis.mod ? 'eINT' : 'eWIS' ) : 'mDEX' ) + ': <b>' + eAttMod + '</b><br>' : '' ) +
                            ( attack >= targeted.actor.data.data.attributes.ac.value ? '<b>Damage ('+ damage +'): ' + baseRoll + '</b> + ySTR: <b>' + selected.actor.data.data.abilities.str.mod +
                                '</b> &ndash; tCON: <b>' + targeted.actor.data.data.abilities.con.mod + '</b><br>' + 
                                ( eAllies.length > 0 ? '&nbsp;&nbsp;&nbsp;+ ' + ( eType == 'npc' ? 'eCHA' : 'mSTR' ) + ': <b>' + eDamMod + '</b><br>' : '' ) +
                            '&nbsp;&nbsp;&nbsp;* <b>5</b> * yHP/tHP (<b>' + selected.actor.hitPoints.current + '</b>' + ( selected.name.includes('Cavalry') ? ' * <b>2</b> (CavAtk) ' : '' ) + ' / <b>' + targeted.actor.hitPoints.current + '</b>)' : '') + 
                            '<br><br>' +
                            '<b>' + targeted.name + '</b> counterattacked, rolling ' + cAttack + '</b> ' + ( cAttack >= selected.actor.data.data.attributes.ac.value ? 'for <b>' + cDamage + '</b> damage. <br>' : 'and missed.' ) + '<br>' +
                            '<b>Roll (' + cRollResult + ') </b><br>' +
                            '<b>Attack ('+ cAttack +'): ' + cBaseRoll + '</b> + yDEX: <b>' + targeted.actor.data.data.abilities.dex.mod +
                                '</b> &ndash; tDEX: <b>' + selected.actor.data.data.abilities.dex.mod + '</b><br>' + 
                                ( ceAllies.length > 0 ? '&nbsp;&nbsp;&nbsp;+ ' + ( ceType == 'npc' ? ( ceAllies[0].actor.data.data.abilities.int.mod > ceAllies[0].actor.data.data.abilities.wis.mod ? 'eINT' : 'eWIS' ) : 'mDEX' ) + ': <b>' + ceAttMod + '</b><br>' : '' ) +
                            ( cAttack >= selected.actor.data.data.attributes.ac.value ? '<b>Damage ('+ cDamage +'): ' + cBaseRoll + '</b> + ySTR: <b>' + targeted.actor.data.data.abilities.str.mod +
                                '</b> &ndash; tCON: <b>' + selected.actor.data.data.abilities.con.mod + '</b><br>' + 
                                ( ceAllies.length > 0 ? '&nbsp;&nbsp;&nbsp;+ ' + ( ceType == 'npc' ? 'eCHA' : 'mSTR' ) + ': <b>' + ceDamMod + '</b><br>' : '' ) +
                            '&nbsp;&nbsp;&nbsp;* <b>5</b> * yHP/tHP (<b>' + targeted.actor.hitPoints.current + '</b> / <b>' + selected.actor.hitPoints.current + '</b>' + ( selected.name.includes('Cavalry') ? ' * <b>2</b> (CavAtk) ' : '' ) + ')' : '');

//get current HPs and apply damage to both
    let tHP = targeted.actor.hitPoints.current;
    let yHP = selected.actor.hitPoints.current;

    targeted.actor.update({"data.attributes.hp.value" : Math.max(tHP - damage,0)});
    selected.actor.update({"data.attributes.hp.value" : Math.max(yHP - cDamage,0)});
    
    if ( selected.actor.hitPoints.current <= 0 && !selected.data.effects.includes('icons/svg/skull.svg') ) { 
            selected.toggleEffect('icons/svg/skull.svg', {overlay: true});
        };
    if ( targeted.actor.hitPoints.current <= 0 && !targeted.data.effects.includes('icons/svg/skull.svg') ) { 
            targeted.toggleEffect('icons/svg/skull.svg', {overlay: true});
        };

//send ChatMessage        
    var chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: messageContent,
            _roll: diceroll
    };
    
    ChatMessage.create(chatData, {});
    chatData.roll;
    
}
