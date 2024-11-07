// rotate walls

let centerPoint = canvas.walls.controlled.reduce((acc, wall) => {
    let wallX = wall.document.c[0];
    let wallY = wall.document.c[1];
    acc.x += wallX;
    acc.y += wallY;
    
    return acc;
},{x: 0, y:0})

centerPoint.x = centerPoint.x / canvas.walls.controlled.length;
centerPoint.y = centerPoint.y / canvas.walls.controlled.length;

const walls = canvas.walls.controlled.map(wall => {
    let w = duplicate(wall.document);
    
    const mid_offset_0 = w.c[0] - centerPoint.x;
    const mid_offset_1 = w.c[1] - centerPoint.y;
    const mid_offset_2 = w.c[2] - centerPoint.x;
    const mid_offset_3 = w.c[3] - centerPoint.y;
    
    w.c[0] = centerPoint.x - mid_offset_1;
    w.c[1] = centerPoint.y + mid_offset_0;
    w.c[2] = centerPoint.x - mid_offset_3;
    w.c[3] = centerPoint.y + mid_offset_2;
    
    return {_id: w._id, c: w.c};
});

canvas.scene.updateEmbeddedDocuments("Wall", walls);

// fix proportions

x0 = canvas.scene.dimensions.sceneRect.width;
y0 = canvas.scene.dimensions.sceneRect.height;

x = y0/x0;
y = x0/y0;

const walls = canvas.walls.controlled.map(wall => {
    let w = duplicate(wall.document);
    
    w.c[0] = w.c[0] * x;
    w.c[1] = w.c[1] * y;
    w.c[2] = w.c[2] * x;
    w.c[3] = w.c[3] * y;
    
    return {_id: w._id, c: w.c};
});

canvas.scene.updateEmbeddedDocuments("Wall", walls);
