function scenario1() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertBoxIntoBoard(new Box(0, 21, 5, 3, 9));
    current_game.fallingBox = new Box(2, 14, 5, 5, 5);
    current_game.insertBoxIntoBoard(new Box(1, GAME_HEIGHT - 2, 2, 2, 2));
    current_game.insertBoxIntoBoard(new Box(3, GAME_HEIGHT - 11, 11, 4, 11));
    current_game.start()
}

function scenario2() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertBoxIntoBoard(new Box(12, 29, 3, 3, 3));
    current_game.fallingBox = new Box(14, 29 - 3 - 2, 3, 3, 3);
    current_game.insertBoxIntoBoard(new Box(12, 29 - 2, 2, 2, 2));
    current_game.start()
}

function scenario3() {
    if (current_game) {
        current_game.running = false;
        clearInterval(current_game.interval);
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT)
    current_game.insertBoxIntoBoard(new Box (12, 29, 1, 1, 1));
    current_game.fallingBox = new Box (12, 26, 1, 1, 1);
    current_game.insertBoxIntoBoard(new Box (11, 30, 2, 2, 2));
    current_game.insertBoxIntoBoard(new Box (11 - 3, 29, 3, 3, 3));
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
    current_game.fallingBox = new Box (12, 21, 4, 4, 4);
    current_game.start()

}