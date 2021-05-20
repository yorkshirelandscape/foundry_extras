main ();

async function main() {
    
    console.log(_token);
    
    if( !_token.data.actorData.data ) {
        ui.notifications.error('Select a military unit, not a character.');
        return;
    }
    
    if( canvas.tokens.controlled.length == 0 ||  canvas.tokens.controlled.length > 1){
            ui.notifications.error("Please select a single token.");
            return;
        }

    var target = [];
    game.user.targets.forEach(i => {
        let tActor = i.actor;
        target.push(tActor);
    });

    if(target.length == 0 || target.length > 1){
            ui.notifications.error("Please select a single target.");
            return;
        }
        
    let selected = _token;
    let targeted = Array.from(game.user.targets)[0];

    let hostiles = canvas.tokens.placeables.filter(t => !t._controlled &&
                        t.data.disposition == selected.data.disposition * -1 && 
                        t.actor.hitPoints.max > 350
                        );
    let nHostiles = hostiles.reduce((acc, t) => {
        if(canvas.grid.measureDistance(selected, t) < canvas.dimensions.distance ) {
            acc.push(t);
        }
        return acc;
    },[]);
    let ntHostiles = nHostiles.filter(t => t.id != game.user.targets.ids[0]);
    let nhCount = nHostiles.length;
    let nthCount = ntHostiles.length;
    
    let nthDistPairs = nHostiles.map( sourcePoint =>  {
        return {
            source: sourcePoint,
            targets: nHostiles
        }});
    
    let nthDistCheck = [];
        nthDistPairs.forEach( sourceAndTargets => {
            sourceAndTargets.targets.forEach( target => {
                nthDistCheck.push(Math.ceil(canvas.grid.measureDistance(sourceAndTargets.source, target) / 10 ) * 10 );
            });
        });
    
    let allies = canvas.tokens.placeables.filter(t => !t._controlled &&
                        t.data.disposition == selected.data.disposition );
    let eAllies = allies.reduce((acc, t) => {
        if(canvas.grid.measureDistance(selected, t) < 10 ) {
            acc.push(t);
        }
        return acc;
    },[]);

    let eType = ''; 
    let eAttMod = 0;
    let eDamMod = 0;
    
    if ( eAllies.length > 0 ) {
    eType = ( eAllies[0].actor.data.data.abilities.int.mod < 0 ? 'monster' : 'npc' );
    eAttMod = ( eType == 'monster' ? eAllies[0].actor.data.data.abilities.dex.mod : ( eAllies[0].actor.data.data.abilities.int.mod > eAllies[0].actor.data.data.abilities.wis.mod ? eAllies[0].actor.data.data.abilities.int.mod : eAllies[0].actor.data.data.abilities.wis.mod ) );
    eDamMod = ( eType == 'monster' ? eAllies[0].actor.data.data.abilities.str.mod : eAllies[0].actor.data.data.abilities.cha.mod ); } 
    
    let nAllies = allies.reduce((acc, t) => {
        if( canvas.grid.measureDistance(targeted, t) < canvas.dimensions.distance ) {
            acc.push(t);
        }
        return acc;
    },[]);
    
        
    let naDistCheck = [];
    nAllies.forEach( ally => {
        naDistCheck.push(Math.ceil(canvas.grid.measureDistance(ally, selected) / 10 ) * 10 );
    });
    
    let flanking = naDistCheck.includes(canvas.dimensions.distance*1.75);
    
    let yLoc = canvas.grid.grid.getGridPositionFromPixels( _token.x, _token.y);

    let leavingDifficult = typeof canvas.terrain.costGrid[yLoc[0]][yLoc[1]] != 'undefined';
    
    let tLoc = canvas.grid.grid.getGridPositionFromPixels( targeted.x, targeted.y);

    let enteringDifficult = typeof canvas.terrain.costGrid[tLoc[0]][tLoc[1]] != 'undefined';
    
    let dt = leavingDifficult != enteringDifficult;
    
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
    
    let allWalls = [];
    canvas.walls.quadtree.objects.forEach( w => {
            allWalls.push( {x1: w.t.data.c[0], y1: w.t.data.c[1], x2: w.t.data.c[2], y2: w.t.data.c[3], dir: w.t.data.dir, h: w.t.data.flags.wallHeight.wallHeightTop} );
    });
    
    let crossWalls = allWalls.reduce( (acc, w ) => {
        if ( midPoint.x >= Math.min(w.x1, w.x2) && midPoint.x <= Math.max(w.x1, w.x2) &&
                midPoint.y >= Math.min(w.y1, w.y2) && midPoint.y <= Math.max(w.y1, w.y2)    
            ){
            acc.push(w);
        }
        return acc;
    },[]);
    
    
    let cWall = Array.from(crossWalls)[0];
    
    let dirZ = '';
    if( typeof cWall != 'undefined' ) {
    if( cWall.x1 >= cWall.x2 && cWall.dir == 1 && dir.x == 1 ) { dirZ = -1 }
        else if( cWall.x1 >= cWall.x2 && cWall.dir == 1 && dir.x == -1 ) { dirZ = 1 }
        else if( cWall.x1 >= cWall.x2 && cWall.dir == 2 && dir.x == 1 ) { dirZ = 1 }
        else if( cWall.x1 >= cWall.x2 && cWall.dir == 2 && dir.x == -1 ) { dirZ = -1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 1 && dir.x == 1 ) { dirZ = 1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 1 && dir.x == -1 ) { dirZ = -1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 2 && dir.x == 1 ) { dirZ = -1 }
        else if( cWall.x1 < cWall.x2 && cWall.dir == 2 && dir.x == -1 ) { dirZ = 1 }
        else { dirZ = 0 } }
    
    var diceroll = new Roll('1d20').roll();
    var rollResult = diceroll.total;
    var baseRoll = rollResult + 5 + ( flanking ? 2 : 0 ) - nthCount - ( dt ? 1 : 0 ) + dirZ*-1;
    var attack = baseRoll + selected.data.actorData.data.abilities.dex.mod - target[0].data.data.abilities.dex.mod + eAttMod;
    var damage = Math.round( (baseRoll + selected.data.actorData.data.abilities.str.mod - target[0].data.data.abilities.con.mod + eDamMod) * 5 *              ( selected.actor.hitPoints.current / target[0].data.data.attributes.hp.value ) );
    var messageContent = 'You rolled <b>' + attack + '</b> for <b>' + damage + '</b> damage. <br>' +
                            '<b>Roll: ' + rollResult + '</b> + <b>5</b> for attacking <br>' +
                                (flanking ? '&nbsp;&nbsp;&nbsp;+<b>2</b> for flanking <br>' : '' ) +
                                ( nthCount > 0 ? '&nbsp;&nbsp;&nbsp;&ndash;<b>' + nthCount + '</b> for adjacent enemy units not targeted <br>' : '' ) +
                                ( dirZ != 0 ? '&nbsp;&nbsp;&nbsp;<b>' + ( dirZ == 1 ? '&ndash;1' : '+1' ) + '</b> for attacking ' + ( dirZ == 1 ? 'uphill' : 'downhill' ) + '<br>' : '' ) +
                                ( dt ? '&nbsp;&nbsp;&nbsp;&ndash;<b>1</b> for ' + ( leavingDifficult ? 'leaving' : 'entering' ) + ' difficult terrain <br>' : '' ) +
                            '<b>Attack: ' + baseRoll + '</b> + yDEX: <b>' + selected.data.actorData.data.abilities.dex.mod +
                                '</b> &ndash; tDEX: <b>' + target[0].data.data.abilities.dex.mod + '</b><br>' + 
                                ( eAllies.length > 0 ? '&nbsp;&nbsp;&nbsp;+ ' + ( eType = 'npc' ? ( eAllies[0].actor.data.data.abilities.int.mod > eAllies[0].actor.data.data.abilities.wis.mod ? 'eINT' : 'eWIS' ) : 'mDEX' ) +
                                ': <b>' + eAttMod + '</b><br>' : '' ) +
                            '<b>Damage: ' + baseRoll + '</b> + ySTR: <b>' + selected.data.actorData.data.abilities.str.mod +
                                '</b> &ndash; tCON: <b>' + target[0].data.data.abilities.con.mod + '</b><br>' + 
                                ( eAllies.length > 0 ? '&nbsp;&nbsp;&nbsp;+ ' + ( eType = 'npc' ? 'eCHA' : 'mSTR' ) + ': <b>' + eDamMod + '</b><br>' : '' ) +
                            '&nbsp;&nbsp;&nbsp;* <b>5</b> * yHP/tHP (<b>' + selected.actor.hitPoints.current + '</b> / <b>' + target[0].data.data.attributes.hp.value + '</b>)';
    
        
    var chatData = {
            user: game.user._id,
            speaker: ChatMessage.getSpeaker(),
            content: messageContent,
            _roll: diceroll
    };
    
    ChatMessage.create(chatData, {});
    chatData.roll;
}