const gm = game.user;
const gmMacros = gm.getHotbarMacros(5);

for (const macroDoc of gmMacros) {
  if (macroDoc.macro !== null) {
    macroDoc.macro.ownership.default = 1;
  }
}

for (const user of game.users) {
  if (user !== gm) {
    for (let i = 0; i < 10; i++) {
      let macroDoc = gmMacros[i].macro;
      await user.assignHotbarMacro(macroDoc, i + 1);
    }
  }    
} 
ui.notifications.info(`Pushed macros to all users.`)
