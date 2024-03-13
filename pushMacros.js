const gm = game.user;
const gmMacros = gm.getHotbarMacros(5);

for (const macroDoc of gmMacros) {
  if (macroDoc.macro !== null) {
    await macroDoc.macro.update( { 'ownership.default': 2 } );
  }
}

for (const user of game.users) {
  if (user !== gm) {
    let userMacros = user.getHotbarMacros(1);
    for (let i = 0; i < 10; i++) {
      let macroDoc = gmMacros[i].macro;
      let slot = userMacros.find((s) => s.macro == null );
      if (slot) {
          await user.assignHotbarMacro( macroDoc, slot );
      }
    }
  }    
} 
ui.notifications.info(`Pushed macros to all users.`)
