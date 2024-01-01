function newGame() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT, new SVGRenderer())
}

function setFallingBox(box) {
    current_game.fallingBox = box
    current_game.fallingBox.state = BoxState.ACTIVE
    current_game.insertBoxIntoBoard(current_game.fallingBox)
}

function scenario1() {
    newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, 21, 5, 3, 9));
    setFallingBox(new Box(2, 14, 5, 5, 5));
    current_game.insertFixedBoxIntoBoard(new Box(1, GAME_HEIGHT - 2, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(3, GAME_HEIGHT - 11, 11, 4, 11));
    current_game.start()
}

function scenario2() {
    newGame();
    current_game.insertFixedBoxIntoBoard(new Box(12, 29, 3, 3, 3));
    setFallingBox(new Box(14, 29 - 3 - 2, 3, 3, 3));
    current_game.insertFixedBoxIntoBoard(new Box(12, 29 - 2, 2, 2, 2));
    current_game.start()
}

function scenario3() {
    newGame();
    current_game.insertFixedBoxIntoBoard(new Box (12, 29, 1, 1, 1));
    setFallingBox(new Box (12, 26, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box (11, 30, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box (11 - 3, 29, 3, 3, 3));
    current_game.start()
}


function scenario4() {
    newGame();
    const growingBox = new GrowingBox(11, 26, 7, 5, 5)
    growingBox.center_x = 13.5
    growingBox.center_y = 28
    current_game.insertBoxIntoBoard(growingBox);
    current_game.growingBoxes.push(growingBox)
    setFallingBox(new Box (12, 21, 4, 4, 4));
    current_game.start()
}



function scenario5() {
    newGame();
    current_game.insertFixedBoxIntoBoard(new Box(0, 22, 1, 1, 1))
    setFallingBox(new Box(0, 18, 1, 1, 1));
    current_game.insertFixedBoxIntoBoard(new Box(1, 21, 2, 2, 2));
    current_game.insertFixedBoxIntoBoard(new Box(0, 23, 3, 3, 3));
    
    current_game.insertFixedBoxIntoBoard(new Box(0, 26, 6, 6, 6));
    current_game.insertFixedBoxIntoBoard(new Box(4, 22, 4, 4, 4));
    current_game.start()

}

function scenario6() {
    newGame();
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
    newGame();
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
    newGame();
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

function scenario9() {
    newGame();

    const nonSquareBox = new Box(0, GAME_HEIGHT - 5, 4, 3, 5)
    current_game.insertFixedBoxIntoBoard(nonSquareBox);
    current_game.nonSquareBoxes.push(nonSquareBox)
    current_game.insertFixedBoxIntoBoard(new Box(4, GAME_HEIGHT - 4, 4, 4, 4));

    current_game.running = true;
    for (let i = 0; i < 8 * 4; ++i) {
        current_game.nextTick()
    }
}

function scenario10() {
    newGame();

    const nonSquareBox = new Box(0, GAME_HEIGHT - 4, 5, 5, 4)
    current_game.insertFixedBoxIntoBoard(nonSquareBox);
    current_game.nonSquareBoxes.push(nonSquareBox)
    current_game.insertFixedBoxIntoBoard(new Box(8, GAME_HEIGHT - 5, 5, 5, 5)); //Propup
    current_game.insertFixedBoxIntoBoard(new Box(8 - 4, GAME_HEIGHT - 5 - 5, 5, 5, 5));
}
function scenario12() {
    newGame();
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
    debugger
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
