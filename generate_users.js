/*
Derived from code by meneltamar and Martin Leitner-Ankerl (https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/).

Setup Instructions:
  - If you wish to use the password generator, set use_pw to true.
  - In the characters object below, replace every instance of WORD with
    a four-letter word beginning with the corresponding letter. 
  - Capitalize them however you want, but I'd recommend something consistent.
  - If you only want to think of one word per letter, just repeat the 
    first one. The only downside is that a word might repeat in a password.
  - Replace every 0 with a randomly chosen digit. 
  - If you're unsure which words to use for the numbers, you could reuse
    the words you chose for the letter the number's name begins with.
    i.e., 'Earn' for 8, 'Tarp' for 2, etc.
  - If you'd like, you can customize the numbers object as well, but 
    there's probably no good reason to.
  - Optionally, you can set the value of pm below to true and the macro
    will take the contents of your macro bar 5 and push it to every player's
    macro bar 1. This way your new users have a standard set of macros.

That should be it. Drop me a line if it gives you any trouble.
*/

const use_pw = false; // use password generator?
const use_pm = false; // push macros to new users?

let session = prompt('Name of actor folder (new or existing):', 'PCs' );

if ( session === '' ) {
    ui.notifications.error( 'You must provide a folder name.' );
    return;
}

let input = prompt('Input comma separated list of users');

if ( input === '' ) {
    ui.notifications.error( 'You must provide at least one user name.' );
    return;
}

const characters = { 
    ['a']: [ 'WORD', 'WORD', '0' ], ['b']: [ 'WORD', 'WORD', '0' ], ['c']: [ 'WORD', 'WORD', '0' ], 
    ['d']: [ 'WORD', 'WORD', '0' ], ['e']: [ 'WORD', 'WORD', '0' ], ['f']: [ 'WORD', 'WORD', '0' ], 
    ['g']: [ 'WORD', 'WORD', '0' ], ['h']: [ 'WORD', 'WORD', '0' ], ['i']: [ 'WORD', 'WORD', '0' ], 
    ['j']: [ 'WORD', 'WORD', '0' ], ['k']: [ 'WORD', 'WORD', '0' ], ['l']: [ 'WORD', 'WORD', '0' ], 
    ['m']: [ 'WORD', 'WORD', '0' ], ['n']: [ 'WORD', 'WORD', '0' ], ['o']: [ 'WORD', 'WORD', '0' ], 
    ['p']: [ 'WORD', 'WORD', '0' ], ['q']: [ 'WORD', 'WORD', '0' ], ['r']: [ 'WORD', 'WORD', '0' ], 
    ['s']: [ 'WORD', 'WORD', '0' ], ['t']: [ 'WORD', 'WORD', '0' ], ['u']: [ 'WORD', 'WORD', '0' ], 
    ['v']: [ 'WORD', 'WORD', '0' ], ['w']: [ 'WORD', 'WORD', '0' ], ['x']: [ 'WORD', 'WORD', '0' ], 
    ['y']: [ 'WORD', 'WORD', '0' ], ['z']: [ 'WORD', 'WORD', '0' ], ['1']: [ 'WORD', 'WORD', '0' ], 
    ['2']: [ 'WORD', 'WORD', '0' ], ['3']: [ 'WORD', 'WORD', '0' ], ['4']: [ 'WORD', 'WORD', '0' ], 
    ['5']: [ 'WORD', 'WORD', '0' ], ['6']: [ 'WORD', 'WORD', '0' ], ['7']: [ 'WORD', 'WORD', '0' ], 
    ['8']: [ 'WORD', 'WORD', '0' ], ['9']: [ 'WORD', 'WORD', '0' ], ['0']: [ 'WORD', 'WORD', '0' ],
};

const numbers = {
    ['0']: [ '!', '@' ],
    ['1']: [ '@', '#' ],
    ['2']: [ '#', '$' ],
    ['3']: [ '$', '%' ],
    ['4']: [ '%', '^' ],
    ['5']: [ '^', '&' ],
    ['6']: [ '&', '*' ],
    ['7']: [ '*', '.' ],
    ['8']: [ '.', '?' ],
    ['9']: [ '?', '!' ],
}


function hsvToHex( h, s, v ) {
  let h_i = Math.floor( h * 6 );
  let f = h * 6 - h_i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  let r, g, b;
         if (h_i === 0) { [ r, g, b ] = [ v, t, p ];
  } else if (h_i === 1) { [ r, g, b ] = [ q, v, p ];
  } else if (h_i === 2) { [ r, g, b ] = [ p, v, t ];
  } else if (h_i === 3) { [ r, g, b ] = [ p, q, v ];
  } else if (h_i === 4) { [ r, g, b ] = [ t, p, v ];
  } else if (h_i === 5) { [ r, g, b ] = [ v, p, q ];
  }

  [ r, g, b ] = [ r, g, b ].map( (c) => ( '0' + Math.round(c * 255).toString(16) ).slice(-2) );
  
  return '#' + r + g + b
}

const goldenRatioConjugate = 0.618033988749895;

function getRandomColor( s, v ) {
    let h = Math.random(); // use random start value
    h += goldenRatioConjugate;
    h %= 1;
    return hsvToHex( h, s, v );
}

let userNames = input.split(",");

async function createOrFindFolder(){
    pc_folder = game.folders.find(entry => entry.name === session && entry.type === "Actor");
    if (pc_folder){
    } else {
   pc_folder = Folder.create({name : session, type: CONST.FOLDER_DOCUMENT_TYPES[0], color: getRandomColor( 0.99, 0.7 ) });
}
   return(pc_folder)
}

async function createUser(username) {
    username = username.trim()
    let folder = await createOrFindFolder()
    let actor = await Actor.implementation.create({
        name: username,
        type: "character",
        folder: folder.id
    });
    let pw = '';
    if (use_pw) {
        pw = await generatePassword( username );
    }
    const userCheck = game.users.find((u) => u.name === username );
    let user;
    if (!userCheck) { 
        user = await User.create({name: username, role: 1, password: pw, character: actor, color: getRandomColor( 0.7, 0.99 )})
    } else {
        user = userCheck;
    }    

    let id = user.id
    let owner_obj = actor.ownership
    owner_obj[id] = 3
    await actor.update({
        ownership: owner_obj
    })
    return [user, pw];
}

async function generatePassword( username ) {
    username = username.toLowerCase();
    const slug = Array.from( username ).slice(0,3);
    const [ x, y, z ] = slug;

    const a = characters[ x ][0];
    const b = characters[ y ][ y == x ? 1 : 0 ];
    const c = characters[ z ][ ( z == x || z == y ) ? 1 : 0 ];

    const foo = characters[ x ][2];
    const bar = characters[ y ][2];
    const baz = numbers[ bar ][0];

    return a + foo + b + baz + c;
}

async function pushMacros( user, gmMacros ) {
    let userMacros = user.getHotbarMacros(1);
    for (let i = 0; i < 10; i++) {
        let macroDoc = gmMacros[i].macro;
        let slot = userMacros.find((s) => s.macro == null );
        if (slot && macroDoc ) {
            await user.assignHotbarMacro( macroDoc, slot );
        }
    }
}

const gm = game.user;
const gmMacros = gm.getHotbarMacros(5);

for (const macroDoc of gmMacros) {
    if (macroDoc.macro) {
        macroDoc.macro.update( { 'ownership.default': 2 } );
    }
}

let record = '';

for (const userName of userNames) {
    [userAcct, pw] = await createUser(userName);
    await pushMacros( userAcct, gmMacros );
    record += `<tr><td style="user-select:text">${userName}</td><td style="user-select:text">${pw}</td></tr>`;
}

const uNum = userNames.length;

const template = `
    <div>
    <p>Created ${uNum} user${uNum > 1 ? 's' : ''}.</p>
    <table>
    <thead>
    <tr><th>User</th><th>Password</th></tr>
    </thead>
    <tbody>
    ${record}
    </tbody>
    </table>
    </div>
`

new Dialog(
    {
      title: "User Generator",
      content: template,
      buttons: {
        close: {
          label: "Close",
        },
      },
    }, 
    { width: 400 } 
).render(true);
