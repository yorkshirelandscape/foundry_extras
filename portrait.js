/*
Requires the following:
    - Any number of users, each with a selected character assigned in User Configuration.
    - Each of these characters must have an assigned avatar (character art).
	- The script assumes the character art is taller than it is wide, or square.
    - On your landing page, one token per user with the name 'portrait x' where x is a number from 1 to the number of 
	users you have.
	- The script supports any size and proportion (in grid squares) of token, as well as rotation.
    - Somewhere suitable near the tokens, one text drawing per user with the text 'Player x' where x is the number
	mentioned above.
*/



Hooks.on("canvasReady", async function (canvas){
    const size = 1;
    let party = game.actors.party.members.filter((c) => c.type == 'character' && !['Animal Companion','Eidolon','Construct Companion'].includes( c.class?.name ) );
    party = party.length == 0 ? null : party;
    const users = party || game.users.filter(u => !u.isGM && u.name !== 'yorkshirelandscape' && u.character !== null).map((u)=> u.character);
    let maxPNum = Math.max(...users.map( u => u.getFlag('world','userManager.playerNum') ) );

    users.filter( u => !u.getFlag('world','userManager') ).forEach( async (u,i) => {
		await u.setFlag('world','userManager', { playerNum: maxPNum++ } );
    });

    users.filter( u => !u.getFlag('world','userManager.playerNum') ).forEach( async (u,i) => {
		await u.setFlag('world', 'userManager.playerNum', maxPNum++ );
    });

    users.sort( (a,b) => a.getFlag('world','userManager.playerNum') - b.getFlag('world','userManager.playerNum') ); 

    let portraitTokens = canvas.tokens.placeables.filter(t => t.name.substring(0,8).toLowerCase() === 'portrait');

    portraitTokens = portraitTokens.sort( (a,b) => a.name.match(/[0-9]+(?=\)$)/)[0] - b.name.match(/[0-9]+(?=\)$)/)[0] );

    pTMatch = portraitTokens;

    let c = 1;
    portraitTokens.forEach( token => {
		let playerNo = token.name.match(/[0-9]+(?=\)$)/)[0];
		token.id2 = `token${playerNo}`;	
		let matches = pTMatch.filter( t => t.name === token.name ).length;
		if ( matches > 1 ) {
			token.id2 = 'token' + playerNo  + '.' + c;
			c++;
		} else {
			c = 1;
		}
    });

    const playerLabels = game.canvas.drawings.objects.children.filter(d => 
		d.text.text.substring(0,6).toLowerCase() === 'player'
	).sort( (a,b) => a.text.text.match(/[0-9]+$/)[0] - b.text.text.match(/[0-9]+$/)[0] );

    playerLabels.forEach( (drawing, i) => {
		let playerNo = drawing.text.text.match(/[0-9]+$/)[0];
		drawing.id2 = `player-label${playerNo}`;
    });

    if(!portraitTokens) return;

	let characters = [];
	
	users.forEach((u) => {
		u.owner = { id: u.id, name: u.name, playerNum: u.playerNum };
		characters.push( u );
	});
	
	characters = characters.sort((a,b) => a.owner.playerNum - b.owner.playerNum );
	
   	characters.forEach( async (c,i) => {
        let playerLabel = playerLabels.find( l => l.id2 === `player-label${i+1}`);
        playerLabel.text.text = c.prototypeToken.name.match(/[^\s]+/)[0];
		let portraitToken = portraitTokens.find(t => t.id2 === `token${i+1}`);
		let markerTexture;
		if (c.img === 'systems/pf2e/icons/default-icons/character.svg') {
				markerTexture = await loadTexture('modules/pfs2/assets/pfs-tan.svg');
				await portraitToken.mesh.document.update({alpha: 1});
				portraitToken.refresh();
			} else {
				markerTexture = await loadTexture(c.img);
				await portraitToken.mesh.document.update({alpha: 0});
				portraitToken.refresh();
		}
		let textureAR = markerTexture.baseTexture.width / markerTexture.baseTexture.height;
		let textureARinv = markerTexture.baseTexture.height / markerTexture.baseTexture.width;
		let tokenAR = portraitToken.document.width / portraitToken.document.height;
		let textureHeight = 0;
		let textureWidth = 0; 
		if ( textureAR < tokenAR ) {
			textureHeight = canvas.grid.size * portraitToken.document.height;	
			textureWidth = canvas.grid.size * portraitToken.document.width * tokenAR;
		} else {
			textureHeight = canvas.grid.size * portraitToken.document.width * textureARinv;
			textureWidth = canvas.grid.size * portraitToken.document.width;	
		}
		markerTexture.orig = { height: size * textureHeight, 
				       width: size * textureWidth, 
	                               x: textureWidth * size * 0.5, 
				       y: textureHeight * size * 0.5 };
		let sprite = new PIXI.Sprite(markerTexture)
		sprite.angle = portraitToken.document.rotation;
		if(VideoHelper.hasVideoExtension(c.img)) {
		    sprite.texture.baseTexture.resource.source.loop = true;
		    sprite.texture.baseTexture.resource.source.play();
		}
		sprite.anchor.set(0.5,0.5);
		let markerToken = portraitToken.addChild(sprite)
		portraitToken.sortableChildren = true
		markerToken.zIndex = 100;
		markerToken.transform.position.set(canvas.grid.size * portraitToken.document.width * 0.5, 
						   canvas.grid.size * portraitToken.document.height * 0.5 );
		markerToken.id = `player-portrait${i+1}`;
		markerToken.alpha = 1;
	});
    await new Promise(r => setTimeout(r, 1000));
    users.forEach( u => {
		let characters = game.actors.filter(a => a.getUserLevel(u) === 3 && a.name !== 'Party Loot');
		characters.forEach( c => {
	        let label = game.canvas.drawings.objects.children.find(d => 
				d.text.text === c.prototypeToken.name.match(/[^\s]+/)[0]
			);
	        if (label) { label.refresh(); }
		});
    });
});
