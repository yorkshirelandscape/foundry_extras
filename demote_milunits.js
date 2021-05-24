//couldn't have done this without the work of https://github.com/David-Zvekic/pushTokenBack

main ();

async function main() {

    let milUnits = canvas.tokens.placeables.filter(t => t.name.includes('Infantry') || t.name.includes('Cavalry') );
    let nonMilUnits = canvas.tokens.placeables.filter(t => !t.name.includes('Infantry') || !t.name.includes('Cavalry') );

    let overlaps = [];    
    
    milUnits.forEach( u => {
        nonMilUnits.forEach( c => {
            if(canvas.grid.measureDistance(u, c) < 10 ) {
                overlaps.push( u );
            }
        });
    });

    overlaps.forEach( u => {
        let position = 0;
        canvas.tokens.children[0].children.forEach( c => {
           if( c == u ) {
                canvas.tokens.children[0].children.splice(position,1);
                canvas.tokens.children[0].children.unshift(u);
           }
           position++;
        });
    });
 
}
