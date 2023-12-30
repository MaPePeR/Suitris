function setFallingBox(box) {
    current_game.fallingBox = box
    current_game.fallingBox.state = BoxState.ACTIVE
    current_game.insertBoxIntoBoard(current_game.fallingBox)
}

function scenario1() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertFixedBoxIntoBoard(new Box(0, 21, 5, 3, 9));
    setFallingBox(new Box(2, 14, 5, 5, 5));
    current_game.insertFixedBoxIntoBoard(new Box(1, GAME_HEIGHT - 2, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(3, GAME_HEIGHT - 11, 11, 4, 11));
    current_game.start()
}

function scenario2() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertFixedBoxIntoBoard(new Box(12, 29, 3, 3, 3));
    setFallingBox(new Box(14, 29 - 3 - 2, 3, 3, 3));
    current_game.insertFixedBoxIntoBoard(new Box(12, 29 - 2, 2, 2, 2));
    current_game.start()
}

function scenario3() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertFixedBoxIntoBoard(new Box (12, 29, 1, 1, 1));
    setFallingBox(new Box (12, 26, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box (11, 30, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box (11 - 3, 29, 3, 3, 3));
    current_game.start()
}


function scenario4() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    const growingBox = new GrowingBox(11, 26, 7, 5, 5)
    growingBox.center_x = 13.5
    growingBox.center_y = 28
    current_game.insertBoxIntoBoard(growingBox);
    current_game.growingBoxes.push(growingBox)
    setFallingBox(new Box (12, 21, 4, 4, 4));
    current_game.start()
}



function scenario5() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertFixedBoxIntoBoard(new Box(0, 22, 1, 1, 1))
    setFallingBox(new Box(0, 18, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box(1, 21, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(0, 23, 3, 3, 3));
    
    current_game.insertFixedBoxIntoBoard(new Box(0, 26, 6, 6, 6));
    current_game.insertFixedBoxIntoBoard(new Box(4, 22, 4, 4, 4));
    current_game.start()

}

function scenario6() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 6, 4, 3, 6));
    setFallingBox(new Box(3, GAME_HEIGHT - 6 - 4 - 3, 4, 4, 4));
    current_game.start()
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

function scenario7() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
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
}

function scenario8() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 1, 1, 1,1));
    current_game.insertFixedBoxIntoBoard(new Box(1, GAME_HEIGHT - 3, 3, 3, 3));
    current_game.insertFixedBoxIntoBoard(new Box(4, GAME_HEIGHT - 1, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box(0, GAME_HEIGHT - 3 - 4, 4, 4, 4));

    current_game.fallingBox = new Box(4, GAME_HEIGHT - 3 - 4 - 3, 3, 3, 3)
    current_game.fallingBox.state = BoxState.ACTIVE
    current_game.insertBoxIntoBoard(current_game.fallingBox)

    current_game.running = true;
    for (let i = 0; i < 8 * 4; ++i) {
        current_game.nextTick()
    }
}
