/* eslint no-param-reassign: ["error", { "props": false }] */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
/*
Requires the following:
    - Any number of users, each with a selected character assigned in User Configuration.
    - Each of these characters must have an assigned avatar (character art).
    - On your landing page, one token per user with the name 'portrait (x)' where x is a
      number from 1 to the number of users you have. You can import 'fvtt-Actor-portrait.json'.
    - The script supports any size and proportion (in grid squares) of token, as well as rotation.
    - Somewhere suitable near the tokens, one text drawing per user with the text 'Player x' where
      x is the number mentioned above.
*/

Hooks.on('canvasReady', async (canvas) => {
  const size = 1;
  let party = game.actors.party.members.filter((c) => c.type === 'character' && !['Animal Companion', 'Eidolon', 'Construct Companion'].includes(c.class?.name));
  party = party.length === 0 ? null : party;
  const users = party || game.users.filter((u) => !u.isGM && u.name !== 'yorkshirelandscape' && u.character !== null).map((u) => u.character);
  let maxPNum = 0; // Math.max(...users.map((u) => u.getFlag('world', 'userManager.playerNum')));
  // console.log(maxPNum);

  users.sort((a, b) => {
    if (a.folder.name < b.folder.name) {
      return -1;
    }
    if (a.folder.name > b.folder.name) {
      return 1;
    }
    return 0;
  });

  let f = users[0].folder.name;

  async function setNum(u) {
    maxPNum += (u.folder.name === f ? 1 : (6 - (maxPNum % 6) + 1));
    await u.setFlag('world', 'userManager.playerNum', maxPNum);
  }

  async function setNums(usrs) {
    for (u of usrs) {
      // eslint-disable-next-line no-await-in-loop
      await setNum(u);
      f = u.folder.name;
    }
  }

  await setNums(users);

  const portraitTokens = canvas.tokens.placeables.filter((t) => t.name.substring(0, 8).toLowerCase() === 'portrait');

  const pTMatch = portraitTokens;

  let cnum = 1;
  for (t of portraitTokens) {
    const playerNo = t.name.match(/[0-9]+(?=\)$)/)[0];
    t.id2 = `token${playerNo}`;
    const matches = pTMatch.filter((to) => to.name === t.name).length;
    if (matches > 1) {
      t.id2 = `token${playerNo}.${cnum}`;
      cnum += 1;
    } else {
      cnum = 1;
    }
  }

  const playerLabels = game.canvas.drawings.objects.children
    .filter((d) => d.text?.text.substring(0, 6).toLowerCase() === 'player')
    .sort((a, b) => a.text.text.match(/[0-9]+$/)[0] - b.text.text.match(/[0-9]+$/)[0]);

  playerLabels.forEach((d) => {
    const drawing = d;
    const playerNo = drawing.text.text.match(/[0-9]+$/)[0];
    drawing.id2 = `player-label${playerNo}`;
  });

  if (!portraitTokens) return;

  async function getOwner() {
    const chars = [];
    users.forEach(async (u) => {
      u.owner = { id: u.id, name: u.name, playerNum: await u.getFlag('world', 'userManager.playerNum') };
      chars.push(u);
    });
    return chars;
  }

  const characters = await getOwner();

  async function cPrep(c) {
    const playerLabel = playerLabels.find((l) => l.id2 === `player-label${c.owner.playerNum}`);
    if (!playerLabel) return;
    [playerLabel.text.text] = c.prototypeToken.name.match(/[^\s]+/);
    const portraitToken = portraitTokens.find((t) => t.id2 === `token${c.owner.playerNum}`);
    let markerTexture;
    if (c.img === 'systems/pf2e/icons/default-icons/character.svg') {
      markerTexture = await loadTexture('modules/pfs2/assets/pfs-tan.svg');
      await portraitToken.mesh.document.update({ alpha: 1 });
      portraitToken.refresh();
    } else {
      markerTexture = await loadTexture(c.img);
      await portraitToken.mesh.document.update({ alpha: 0 });
      portraitToken.refresh();
    }
    const textureAR = markerTexture.baseTexture.width / markerTexture.baseTexture.height;
    const textureARinv = markerTexture.baseTexture.height / markerTexture.baseTexture.width;
    const tokenAR = portraitToken.document.width / portraitToken.document.height;
    let textureHeight = 0;
    let textureWidth = 0;
    if (textureAR < tokenAR) {
      textureHeight = canvas.grid.size * portraitToken.document.height;
      textureWidth = canvas.grid.size * portraitToken.document.width * tokenAR;
    } else {
      textureHeight = canvas.grid.size * portraitToken.document.width * textureARinv;
      textureWidth = canvas.grid.size * portraitToken.document.width;
    }
    markerTexture.orig = {
      height: size * textureHeight,
      width: size * textureWidth,
      x: textureWidth * size * 0.5,
      y: textureHeight * size * 0.5,
    };
    const sprite = new PIXI.Sprite(markerTexture);
    sprite.angle = portraitToken.document.rotation;
    if (VideoHelper.hasVideoExtension(c.img)) {
      sprite.texture.baseTexture.resource.source.loop = true;
      sprite.texture.baseTexture.resource.source.play();
    }
    sprite.anchor.set(0.5, 0.5);
    const markerToken = portraitToken.addChild(sprite);
    portraitToken.sortableChildren = true;
    markerToken.zIndex = 100;
    markerToken.transform.position.set(
      canvas.grid.size * portraitToken.document.width * 0.5,
      canvas.grid.size * portraitToken.document.height * 0.5,
    );
    markerToken.id = `player-portrait${c.owner.playerNum}`;
    markerToken.alpha = 1;
  }

  async function cloop(chars) {
    chars.forEach(async (c) => {
      await cPrep(c);
    });
  }

  cloop(characters);

  await new Promise((r) => { setTimeout(r, 1000); });
  users.forEach((u) => {
    const chars = game.actors.filter((a) => a.getUserLevel(u) === 3 && a.name !== 'Party Loot');
    chars.forEach((ch) => {
      const label = game.canvas.drawings.objects.children.find((d) => d.text?.text === ch.prototypeToken.name.match(/[^\s]+/)[0]);
      if (label) { label.refresh(); }
    });
  });
});
