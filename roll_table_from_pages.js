const jname = prompt('Name of Journal Entry to convert:', '' );
const journal = game.journal.find((j) => j.name === jname );

if ( !journal ) return ui.notifications.warn( "No such Journal." );

const pages = Array.from(journal.collections.pages)
    .map((p) => `@UUID[${p.uuid}]{${p.name}}` );

const formula = '1d' + pages.length.toString();

const rt = await RollTable.create({
    name: jname,
    formula: formula,
});

const results = pages.map((p,i) => {
    return {
        text: p,
        type: 0,
        weight: 1,
        range: [i+1,i+1],
    }
});

await rt.createEmbeddedDocuments("TableResult", results);
