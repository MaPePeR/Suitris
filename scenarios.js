async function newGame() {
    renderer = await p_renderer
    renderer.newGame()
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    return current_game = new GameState(GAME_WIDTH, GAME_HEIGHT, renderer)
}

function runTicks(n) {
    current_game.running = true;
    for (let i = 0; i < n; ++i) {
        current_game.nextTick()
    }
}

function setFallingBox(box) {
    current_game.fallingBox = box
    current_game.fallingBox.state = BoxState.ACTIVE
    current_game.insertBoxIntoBoard(current_game.fallingBox)
}

async function scenario1() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, 21, 5, 3, 9));
    setFallingBox(new Box(2, 14, 5, 5, 5));
    current_game.insertFixedBoxIntoBoard(new Box(1, GAME_HEIGHT - 2, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(3, GAME_HEIGHT - 11, 11, 4, 11));
    runTicks(20)
}

async function scenario2() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(12, 29, 3, 3, 3));
    setFallingBox(new Box(14, 29 - 3 - 2, 3, 3, 3));
    current_game.insertFixedBoxIntoBoard(new Box(12, 29 - 2, 2, 2, 2));
    runTicks(20)
}

async function scenario3() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box (12, 29, 1, 1, 1));
    setFallingBox(new Box (12, 26, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box (11, 30, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box (11 - 3, 29, 3, 3, 3));
    runTicks(20)
}


async function scenario4() {
    await newGame();
    const growingBox = new Box(11, 26, 7, 5, 5)
    growingBox.center_x = 13.5
    growingBox.center_y = 28
    current_game.insertBoxIntoBoard(growingBox);
    current_game.growingBoxes.push(growingBox)
    setFallingBox(new Box (12, 21, 4, 4, 4));
    runTicks(20)
}



async function scenario5() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, 22, 1, 1, 1))
    setFallingBox(new Box(0, 18, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box(1, 21, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(0, 23, 3, 3, 3));
    
    current_game.insertFixedBoxIntoBoard(new Box(0, 26, 6, 6, 6));
    current_game.insertFixedBoxIntoBoard(new Box(4, 22, 4, 4, 4));
    runTicks(20)

}

async function scenario6() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 6, 4, 3, 6));
    setFallingBox(new Box(3, GAME_HEIGHT - 6 - 4 - 3, 4, 4, 4));
    runTicks(20)
}

/* Couldn't reproduce :(
function scenario6() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }

    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.fallingBox = new Box(7, 23, 1, 1, 1);
    current_game.insertBoxIntoBoard(new Box(8, 23, 4, 4, 4));
    current_game.insertBoxIntoBoard(new Box(12, 24, 3, 3, 3));
    current_game.insertBoxIntoBoard(new Box(13, 29, 3, 3, 3));
    //current_game.insertBoxIntoBoard(new Box(10, 23, 4, 4, 4))
    current_game.insertBoxIntoBoard(new Box(17, 26, 6, 6, 6));
    current_game.insertBoxIntoBoard(new Box(8, 27, 5, 5, 5));
    
    current_game.running = true;
    current_game.move(1)
    for (let i = 0; i < 8; ++i) {
        current_game.nextTick()
    }
    current_game.move(1)
    debugger
    //current_game.start()
}
*/

async function scenario7() {
    await newGame();
    setFallingBox(new Box(5, 30, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box(6, 30, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(13, 30, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(15, 29, 3, 3, 3));
    current_game.insertFixedBoxIntoBoard(new Box(18, 26, 6, 6, 6));
    current_game.insertFixedBoxIntoBoard(new Box(14, 25, 4, 4, 4));

    current_game.tickCount = 3;
    current_game.running = true;
    current_game.nextTick()

    current_game.move(1)
    current_game.move(1)
    current_game.nextTick()
    current_game.move(1)
    current_game.move(1)
    current_game.move(1)
    current_game.nextTick()
    current_game.move(1)
    current_game.move(1)
    current_game.move(1)
    current_game.move(1)
    current_game.nextTick()

    runTicks(20)
}

async function scenario8() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 1, 1, 1,1));
    current_game.insertFixedBoxIntoBoard(new Box(1, GAME_HEIGHT - 3, 3, 3, 3));
    current_game.insertFixedBoxIntoBoard(new Box(4, GAME_HEIGHT - 1, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 3 - 4, 4, 4, 4));

    current_game.fallingBox = new Box(4, GAME_HEIGHT - 3 - 4 - 3, 3, 3, 3)
    current_game.fallingBox.state = BoxState.ACTIVE
    current_game.insertBoxIntoBoard(current_game.fallingBox)

    runTicks(8 * 4)
}

async function scenario9() {
    await newGame();

    const nonSquareBox = new Box(0, GAME_HEIGHT - 5, 4, 3, 5)
    current_game.insertFixedBoxIntoBoard(nonSquareBox);
    current_game.nonSquareBoxes.push(nonSquareBox)
    current_game.insertFixedBoxIntoBoard(new Box(4, GAME_HEIGHT - 4, 4, 4, 4));

    runTicks(8 * 4)
}

async function scenario10() {
    await newGame();

    const nonSquareBox = new Box(0, GAME_HEIGHT - 4, 5, 5, 4)
    current_game.insertFixedBoxIntoBoard(nonSquareBox);
    current_game.nonSquareBoxes.push(nonSquareBox)
    current_game.insertFixedBoxIntoBoard(new Box(8, GAME_HEIGHT - 5, 5, 5, 5)); //Propup
    current_game.insertFixedBoxIntoBoard(new Box(8 - 4, GAME_HEIGHT - 5 - 5, 5, 5, 5));

    runTicks(10)
}

async function scenario12() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 6, 6, 6, 6))
    current_game.insertFixedBoxIntoBoard(new Box(6, GAME_HEIGHT - 7, 7, 7, 7))
    current_game.insertFixedBoxIntoBoard(new Box(6 + 7, GAME_HEIGHT - 8, 8, 8, 8))
    current_game.insertFixedBoxIntoBoard(new Box(6 + 7 + 8, GAME_HEIGHT - 8, 4, 3, 5))

    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 6 - 5, 5, 5, 5))
    current_game.insertFixedBoxIntoBoard(new Box(5, GAME_HEIGHT - 6 - 5, 4, 4, 4))

    current_game.insertFixedBoxIntoBoard(new Box(8, 22 - 4, 3, 3, 3)) // 1
    current_game.insertFixedBoxIntoBoard(new Box(10, 22, 3, 3, 3)) // 2
    setFallingBox(new Box(5 - 1, 15 - 1, 4, 4, 4))

    current_game.tickCount = 2
    current_game.running = true
    current_game.nextTick() // Make Boxes not NEW
    current_game.moveDown()
    current_game.move(1) // Push 1 to the right
    current_game.nextTick() // 1 and 2 touch
    current_game.nextTick()
    current_game.move(1)
    current_game.nextTick()
    current_game.move(1)
    current_game.nextTick() // growing box and 3 touch
    current_game.move(1)

}

async function scenario13() {
    await newGame();

    current_game.insertFixedBoxIntoBoard(new Box(6, 26, 6, 6, 6));
    current_game.insertFixedBoxIntoBoard(new Box(12, 22, 10, 10, 10));
    current_game.insertFixedBoxIntoBoard(new Box(8, 22, 4, 4, 4));
    current_game.insertFixedBoxIntoBoard(new Box(22, 30, 2, 2, 2));

    current_game.insertFixedBoxIntoBoard(new Box(0, 27, 3, 2, 5)); // 1
    current_game.nonSquareBoxes.push(current_game.fixedBoxes[current_game.fixedBoxes.length - 1])
    current_game.insertFixedBoxIntoBoard(new Box(2 + 1, 25, 3, 3, 3)); // 2

    current_game.insertFixedBoxIntoBoard(new Box(2, 28, 4, 4, 4)); // 3
    setFallingBox(new Box(0 + 6, 31 - 1 - 4 - 1, 1, 1, 1));
    current_game.running = true
    current_game.tickCount = 6045
    current_game.nextTick() // 6046
    current_game.move(-1) // 1 and 2 touch
    current_game.nextTick()
    current_game.move(-1) 
    current_game.nextTick() // Gravity, Grow and 3 and new box touching
    current_game.move(-1)
    current_game.nextTick()
    current_game.move(-1)
    current_game.nextTick()

}

async function scenario14() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 10, 10, 10, 10))
    const shrinkingBox = new Box(10,  GAME_HEIGHT - 9, 3, 1, 9)
    current_game.insertFixedBoxIntoBoard(shrinkingBox)
    current_game.nonSquareBoxes.push(shrinkingBox)
    current_game.insertFixedBoxIntoBoard(new Box(11,  GAME_HEIGHT - 12, 10, 9, 12))
    current_game.insertFixedBoxIntoBoard(new Box(GAME_WIDTH - 3,  GAME_HEIGHT - 3, 3, 3, 3))
    const growingBox = new Box(GAME_WIDTH - 4,  GAME_HEIGHT - 10, 6, 1, 10)
    current_game.insertFixedBoxIntoBoard(growingBox)
    current_game.growingBoxes.push(growingBox)
    
    runTicks(20)
}

async function scenario15() {
    await newGame();
    current_game.insertFixedBoxIntoBoard(new Box(GAME_WIDTH / 2 - 2, 3, 4, 4, 4));
    setFallingBox(new Box(GAME_WIDTH / 2, 0, 1, 1, 1))
    current_game.running = true;
    current_game.moveDown()
    current_game.moveDown()
    current_game.moveDown()
    current_game.moveDown()
    current_game.moveDown()
    if (current_game.fixedBoxes[0].y <= 4) {
        throw new Error("Did not push down box with controls")
    }
}


function compare_test(expected, actual, ...msg) {
    const e = new Set(expected);
    const a = new Set(actual);
    if (a.size != e.size) {
        console.log("Sizes do not match: ", actual, expected, ...msg);
    }
    /*if () {
        throw "Value " + JSON.stringify(actual) + " does not match expected value" + JSON.stringify(expected);
    }*/
}
function compare_array(expected, actual, ...msg) {
    if (JSON.stringify(expected) != JSON.stringify(actual)) {
        console.log("Arrays do not match: ", actual, expected, ...msg)
    }
}
function test_neighbors() {
    const state = new GameState(5, 5)
    const l1 = new Box(0, 5 - 1 - 1 , 1, 1, 1);
    const l2 = new Box(0, 5 - 1 - 2 , 1, 1, 1);
    const l3 = new Box(0, 5 - 1 - 3 , 1, 1, 1);
    const l = [l1, l2, l3];
    const r1 = new Box(4, 5 - 1 - 1 , 1, 1, 1);
    const r2 = new Box(4, 5 - 1 - 2 , 1, 1, 1);
    const r3 = new Box(4, 5 - 1 - 3 , 1, 1, 1);
    const r = [r1, r2, r3];
    const t1 = new Box(1, 5 - 1 - 0 , 1, 1, 1);
    const t2 = new Box(2, 5 - 1 - 0 , 1, 1, 1);
    const t3 = new Box(3, 5 - 1 - 0 , 1, 1, 1);
    const t = [t1, t2, t3];
    const b1 = new Box(1, 5 - 1 - 4 , 1, 1, 1);
    const b2 = new Box(2, 5 - 1 - 4 , 1, 1, 1);
    const b3 = new Box(3, 5 - 1 - 4 , 1, 1, 1);
    const b = [b1, b2, b3];
    [l, r, t, b].forEach(arr => {
        arr.forEach(box => {
            state.insertFixedBoxIntoBoard(box)
        });
    });

    const box = new Box(1, 1, 3, 3, 3);
    state.insertFixedBoxIntoBoard(box)
    compare_test([...state.getBottomNeighbors(box)], b, "bottom", box);
    compare_test([...state.getTopNeighbors(box)], t, "top", box);
    compare_test([...state.getLeftNeighbors(box)], l, "left", box);
    compare_test([...state.getRightNeighbors(box)], r, "right", box);

    for (const box of l) {
        compare_test(box.neighbors_l, [], "wall left", box)
    }
    for (const box of r) {
        compare_test(box.neighbors_r, [], "wall right", box)
    }
    for (const box of t) {
        compare_test(box.neighbors_t, [], "wall top", box)
    }
    for (const box of b) {
        compare_test(box.neighbors_b, [], "wall bottom", box)
    }

    compare_test(l1.neighbors_b, [l2], "left to bottom", l1)
    compare_test(l2.neighbors_b, [l3], "left to bottom", l2)
    compare_test(l3.neighbors_b, [], "left to bottom", l3)

    compare_test(l1.neighbors_t, [], "left to top", l1)
    compare_test(l2.neighbors_t, [l1], "left to top", l2)
    compare_test(l3.neighbors_t, [l2], "left to top", l3)

    compare_test(r1.neighbors_b, [r2], "right to bottom", r1)
    compare_test(r2.neighbors_b, [r3], "right to bottom", r2)
    compare_test(r3.neighbors_b, [], "right to bottom", r3)

    compare_test(r1.neighbors_t, [], "right to top", r1)
    compare_test(r2.neighbors_t, [r1], "right to top", r2)
    compare_test(r3.neighbors_t, [r2], "right to top", r3)

    compare_test(t1.neighbors_r, [t2], "top to right", t1)
    compare_test(t2.neighbors_r, [t3], "top to right", t2)
    compare_test(t3.neighbors_r, [], "top to right", t3)

    compare_test(t1.neighbors_l, [], "top to left", t1)
    compare_test(t2.neighbors_l, [t1], "top to left", t2)
    compare_test(t3.neighbors_l, [t2], "top to left", t3)

    compare_test(b1.neighbors_r, [b2], "bottom to right", b1)
    compare_test(b2.neighbors_r, [b3], "bottom to right", b2)
    compare_test(b3.neighbors_r, [], "bottom to right", b3)

    compare_test(b1.neighbors_l, [], "bottom to left", b1)
    compare_test(b2.neighbors_l, [b1], "bottom to left", b2)
    compare_test(b3.neighbors_l, [b2], "bottom to left", b3)

    compare_array(state.getTopCorners(box),    [4 * 5 + 0, 4 * 5 + 4], "top corners")
    compare_array(state.getBottomCorners(box), [0 * 5 + 0, 0 * 5 + 4], "bottom corners")
    compare_array(state.getLeftCorners(box),   [0 * 5 + 0, 4 * 5 + 0], "left corners")
    compare_array(state.getRightCorners(box),  [0 * 5 + 4, 4 * 5 + 4], "right corners")

    compare_array([...state.getTopIndices(box)],    [4*5 + 1, 4*5 + 2, 4*5 + 3], "top")
    compare_array([...state.getBottomIndices(box)], [0*5 + 1, 0*5 + 2, 0*5 + 3], "bottom")
    compare_array([...state.getLeftIndices(box)],   [1*5 + 0, 2*5 + 0, 3*5 + 0], "left")
    compare_array([...state.getRightIndices(box)],  [1*5 + 4, 2*5 + 4, 3*5 + 4], "right")
}
