const groundBox = new Object()

const VALIDATION = true;
WALL = "WALL!!";

const ALLOW_PUSH = true;

const BoxState = {
    NEW: "NEW",
    ACTIVE: "ACTIVE",
    TO_BE_REMOVED: "TO_BE_REMOVED",
    REMOVED: "REMOVED",
}

class Box {
    constructor(x, y, size, width, height) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.width = width;
        this.height = height;
        this.neighbors_t = [];
        this.neighbors_b = [];
        this.neighbors_l = [];
        this.neighbors_r = [];
        this.state = BoxState.NEW;
        this.lastGravity = 0;
    }

    bottomY() {
        return this.y + this.height - 1;
    }

    rightX() {
        return this.x  + this.width - 1;
    }
}

class GrowingBox extends Box {
    constructor(x, y, size) {
        super(Math.floor(x), Math.floor(y), size, 1, 1);
        this.center_x = x;
        this.center_y = y;
    }
}

function swapOut(arr, idx) {
    if (idx == arr.length - 1) {
        arr.pop()
    } else {
        arr[idx] = arr.pop()
    }
}

class GameState {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.board = new Array(width * height);
        this.board.fill(null)
        this.fixedBoxes = [];
        this.fallingBox = null;
        this.growingBoxes = [];
        this.running = false;
        this.tickCount = 0;
        this.gravityTick = 0;
    }

    start() {
        this.running = true;
        this.interval = setInterval(this.nextTick.bind(this), 500 / 4);
    }

    nextBox() {
        if (this.fallingBox) {
            throw "Invalid state. Already have falling box";
        }
        const size = 1 + Math.floor(Math.random() * 4)
        this.fallingBox = new Box(Math.floor(this.width / 2) - Math.floor(size / 2), 0, size, size, size);
    }

    canFall(box) {
        if (box.bottomY() + 1 == this.height) {
            return false;
        }
        const h = (box.bottomY() + 1) * this.width + box.x;
        for (let i = 0; i < box.width; ++i) {
            if (this.board[h + i]) {
                return false;
            }
        }
        return true;
    }

    insertFixedBoxIntoBoard(box) {
        if (VALIDATION) {
            if (this.fixedBoxes.indexOf(box) >= 0) {
                throw new Error("Box already in fixed boxes array");
            }
            if (box instanceof GrowingBox) {
                throw new Error("Box is GrowingBox, not Box")
            }
        }
        this.fixedBoxes.push(box)
        this.insertBoxIntoBoard(box)
        this.setFixedNeighbors(box)
    }

    insertBoxIntoBoard(box) {
        for (let i = 0; i < box.height; ++i) {
            for (let j = 0; j < box.width; ++j) {
                if (VALIDATION) {
                    if (this.board[(box.y + i) * this.width + box.x + j] !== null) {
                        throw new Error("Overwriting box at x=" + (box.x + j) + " y=" + (box.y + i))
                    }
                }
                this.board[(box.y + i) * this.width + box.x + j] = box;
            }
        }
    }

    removeBoxFromBoard(box) {
        if (VALIDATION) {
            if (box.state !== BoxState.ACTIVE && box.state !== BoxState.NEW) {
                throw new Error("Box to be removed is not active");
            }
        }
        for (let i = 0; i < box.height; ++i) {
            for (let j = 0; j < box.width; ++j) {
                if (VALIDATION) {
                    const cell = this.board[(box.y + i) * this.width + box.x + j]
                    if (cell !== box) {
                        throw new Error("Box in board does not match box to remove at x=" + (box.x + j) + " y=" + (box.y + i))
                    }
                }
                this.board[(box.y + i) * this.width + box.x + j] = null;
            }
        }
    }

    getNeighbors(start, stride, end) {
        const neighbors = [];
        if (0 <= start && start < this.board.length && 0 <= end) {
            end = Math.min(end, this.board.length)
            for (let pos = start; pos < end; pos += stride) {
                if (this.board[pos] && (neighbors.length == 0 || neighbors[neighbors.length - 1] !== this.board[pos])) {
                    neighbors.push(this.board[pos]);
                }
            }
        }
        return neighbors;
    }

    getTopNeighbors(box) {
        return this.getNeighbors((box.y - 1) * this.width + box.x, 1, (box.y - 1) * this.width + box.rightX() + 1);
    }

    getBottomNeighbors(box) {
        return this.getNeighbors((box.bottomY() + 1) * this.width + box.x, 1, (box.bottomY() + 1) * this.width + box.rightX() + 1);
    }

    getLeftNeighbors(box) {
        if (box.x == 0) return [];
        return this.getNeighbors(box.y * this.width + box.x - 1, this.width, (box.bottomY() + 1) * this.width + box.x - 1);
    }

    getRightNeighbors(box) {
        if (box.rightX() + 1 >= this.width) return [];
        return this.getNeighbors(box.y * this.width + box.rightX() + 1, this.width, (box.bottomY() + 1) * this.width + box.rightX() + 1);
    }

    getSameSizeTouchingBoxes(box) {
        // TODO: Only touching if touching along half of their size
        const touching = [];
        function appendSameSize(other) {
            if (other.size == box.size) {
                touching.push(other);
            }
        }
        this.getTopNeighbors(box).forEach(appendSameSize);
        this.getBottomNeighbors(box).forEach(appendSameSize);
        this.getLeftNeighbors(box).forEach(appendSameSize);
        this.getRightNeighbors(box).forEach(appendSameSize);
        if (touching.length > 0) {
            touching.push(box)
            console.log("Touching", touching)
        }
        return touching
    }

    setFixedNeighbors(box) {
        box.neighbors_t = this.getTopNeighbors(box);
        if (box.y == 0) {
            box.neighbors_t.push(WALL)
        }
        box.neighbors_b = this.getBottomNeighbors(box);
        if (box.bottomY() == this.height - 1) {
            box.neighbors_b.push(WALL)
        }
        box.neighbors_l = this.getLeftNeighbors(box);
        if (box.x == 0) {
            box.neighbors_l.push(WALL)
        }
        box.neighbors_r = this.getRightNeighbors(box);
        if (box.rightX() == this.width - 1) {
            box.neighbors_r.push(WALL)
        }
    }

    combineBoxes(boxes) {
        let center_x = 0;
        let center_y = 0;
        boxes.forEach(box => {
            center_x += box.x + 0.5 * box.width;
            center_y += box.y + 0.5 * box.height;
            this.removeBoxFromBoard(box)
            box.state = BoxState.TO_BE_REMOVED;
        })
        const newsize = boxes[0].size + boxes.length - 1;
        if (newsize > 11) {
            return
        }
        center_x /= boxes.length;
        center_y /= boxes.length;
        let newBox = null;
        let closestDistance = Infinity
        for (const box of boxes) {
            if (box.x <= center_x && center_x < box.x + box.width && box.y <= center_y && center_y < box.y + box.height) {
                // center is inside this box.
                newBox = new GrowingBox(center_x, center_y, newsize);
                break;
            } else {
                // Distance point to box from https://stackoverflow.com/a/18157551/2256700
                const dx = Math.max(box.x - center_x, 0, center_x - (box.x + box.width));
                const dy = Math.max(box.y - center_y, 0, center_y - (box.y + box.height));
                const distance = dx*dx + dy*dy;
                if (distance < closestDistance) {
                    closestDistance = distance
                                            /* Center is Right/Below              Center is left/above  else Center is inbetween */
                    const newx = center_x + (box.x + box.width  <= center_x ? -1 : (center_x < box.x ? 1 : 0)) * (dx + 0.5);
                    const newy = center_y + (box.y + box.height <= center_y ? -1 : (center_y < box.y ? 1 : 0)) * (dy + 0.5);
                    if (VALIDATION) {
                        if (!(box.x <= newx && newx < box.x + box.width  && box.y <= newy && newy < box.y + box.height)) {
                            throw new Error("Calculted point is not in box");
                        }
                    }
                    newBox = new GrowingBox(newx, newy, newsize)
                }
            }
        }
        if (!newBox) {
            throw new Error("Failed to create growing box");
        }
        this.setFixedNeighbors(newBox)
        this.growingBoxes.push(newBox)
        this.insertBoxIntoBoard(newBox)
    }

    move(direction) {
        if (this.running && this.fallingBox) {
            this.setFixedNeighbors(this.fallingBox)
            const newx = Math.max(0, Math.min(this.width - this.fallingBox.width, this.fallingBox.x + direction))
            if (this.fallingBox.x != newx) {
                let didshift = false;
                if (ALLOW_PUSH) {
                    this.fixedBoxes.forEach((box) => this.setFixedNeighbors(box)); // TODO only update neighbors that need updating
                    this.growingBoxes.forEach((box) => this.setFixedNeighbors(box));
                }
                if (direction < 0 && this.fallingBox.neighbors_l.length > 0) {
                    if (ALLOW_PUSH && this.shift(this.fallingBox.neighbors_l, 'x', -1, 'neighbors_l')) {
                        didshift = true;
                    } else {
                        return;
                    }
                }
                if (direction > 0 && this.fallingBox.neighbors_r.length > 0) {
                    if (ALLOW_PUSH && this.shift(this.fallingBox.neighbors_r, 'x', 1, 'neighbors_r')) {
                        didshift = true;
                    } else {
                        return;
                    }
                }
                this.removeBoxFromBoard(this.fallingBox)
                this.fallingBox.x = newx;
                this.insertBoxIntoBoard(this.fallingBox)
                if (didshift) {
                    this.fixedBoxes.forEach((box) => this.setFixedNeighbors(box)); // TODO only update neighbors that need updating
                    this.growingBoxes.forEach((box) => this.setFixedNeighbors(box));
                }
                if (this.checkTouching(this.fallingBox)) {
                    this.fallingBox = null;
                }
            }
        }
    }

    moveDown() {
        if (this.running && this.fallingBox) {
            if (this.canFall(this.fallingBox)) {
                this.removeBoxFromBoard(this.fallingBox)
                this.fallingBox.y += 1
                this.insertBoxIntoBoard(this.fallingBox)
                if (this.checkTouching(this.fallingBox)) {
                    this.fallingBox = null;
                }
            }
        }
    }

    checkTouching(box) {
        const touching = this.getSameSizeTouchingBoxes(box);
        if (touching.length > 0) {
            this.combineBoxes(touching)
            return true;
        } else {
            return false;
        }
    }

    shift(boxes, dir_param, dir, neighbor_param) {
        const boxes_to_shift = new Set();
        function r_shift(boxes, nextBoxes) {
            if (boxes.length == 0) {
                return true;
            }
            for (const box of boxes) {
                if (box === WALL) {
                    return false;
                }
                for (const neighbor of box[neighbor_param]) {
                    nextBoxes.push(neighbor);
                }
                boxes_to_shift.add(box);
            }
            boxes.length = 0;
            return r_shift(nextBoxes, boxes);
        };
        if (r_shift([...boxes], [])) {
            boxes_to_shift.forEach(box => {
                this.removeBoxFromBoard(box)
                box[dir_param] += dir;
            });
            boxes_to_shift.forEach(box => {
                this.insertBoxIntoBoard(box)
                this.checkTouching(box)
            });
            return true;
        }
        return false;
    }

    growBox(box) {
        if (VALIDATION) {
            if (box.state !== BoxState.ACTIVE) {
                throw new Error("Cannot grow non active box");
            }
        }
        this.fixedBoxes.forEach((box) => this.setFixedNeighbors(box)); // TODO only update neighbors that need updating
        this.setFixedNeighbors(box)
        if (box.width * box.height >= box.size * box.size) {
            this.removeBoxFromBoard(box)
            box.state = BoxState.TO_BE_REMOVED
            this.insertFixedBoxIntoBoard(new Box(box.x, box.y, box.size, box.width, box.height));
            return;
        }
        if (this.growBoxX(box)) {
            console.log("GrowX successful", box)
        } else {
            console.log("GrowX failed", box)
        }
        if (box.height * box.width < box.size * box.size) {
            this.fixedBoxes.forEach((box) => this.setFixedNeighbors(box)); // TODO only update neighbors that need updating
            this.setFixedNeighbors(box)
            if (this.growBoxY(box)) {
                console.log("GrowY successful", box)
            } else {
                console.log("GrowY failed", box)
            }
        }
        if (this.checkTouching(box)) {
            box.state = BoxState.TO_BE_REMOVED;
        }
    }
    growBoxX(box) {
        const free_left = box.neighbors_l.length == 0;
        const free_right = box.neighbors_r.length == 0;
        const preferLeft = box.center_x < box.x + box.width / 2;
        if (preferLeft && (free_left || (!free_left && !free_right && this.shift(box.neighbors_l, 'x', -1, 'neighbors_l')))) {
            if (VALIDATION && this.getLeftNeighbors(box).length > 0) throw "Growing left, but neighbors exist";
            this.removeBoxFromBoard(box);
            box.width += 1;
            box.x -= 1;
            this.insertBoxIntoBoard(box);
        } else if (free_right || (!free_left && !free_right && this.shift(box.neighbors_r, 'x', 1, 'neighbors_r'))) {
            if (VALIDATION && this.getRightNeighbors(box).length > 0) throw "Growing left, but neighbors exist";
            this.removeBoxFromBoard(box);
            box.width += 1;
            this.insertBoxIntoBoard(box);
        } else if (!preferLeft && (free_left || (!free_left && !free_right && this.shift(box.neighbors_l, 'x', -1, 'neighbors_l')))) {
            if (VALIDATION && this.getLeftNeighbors(box).length > 0) throw "Growing left, but neighbors exist";
            this.removeBoxFromBoard(box);
            box.width += 1;
            box.x -= 1;
            this.insertBoxIntoBoard(box);
        } else {
            return false;
        }
        return true;
    }

    growBoxY(box) {
        const free_top = box.neighbors_t.length == 0;
        const free_bottom = box.neighbors_b.length == 0;
        const prefer_top = box.y + box.height / 2 > box.center_y;
        if (prefer_top && (free_top || (!free_top && !free_bottom &&this.shift(box.neighbors_t, 'y', -1, 'neighbors_t')))) {
            // Top is free
            this.removeBoxFromBoard(box);
            box.height += 1;
            box.y -= 1;
            this.insertBoxIntoBoard(box);
            return true;
        }
        if (free_bottom || (!free_top && !free_bottom && this.shift(box.neighbors_b, 'y', 1, 'neighbors_b'))) {
            // Bottom is free
            this.removeBoxFromBoard(box);
            box.height += 1;
            this.insertBoxIntoBoard(box);
            return true;
        }
        if (!prefer_top && (free_top || (!free_top && !free_bottom && this.shift(box.neighbors_t, 'y', -1, 'neighbors_t')))) {
            // Top is free
            this.removeBoxFromBoard(box);
            box.height += 1;
            box.y -= 1;
            this.insertBoxIntoBoard(box);
            return true;
        }
    }

    switchBoxStatesForNextTick(arr) {
        for (let i = 0; i < arr.length; ++i) {
            if (arr[i].state === BoxState.TO_BE_REMOVED) {
                arr[i].state == BoxState.REMOVED;
                swapOut(arr, i);
                --i;
            } else if (arr[i].state === BoxState.NEW) {
                arr[i].state = BoxState.ACTIVE;
            }
        }
    }

    nextTick() {
        this.tickCount = (this.tickCount + 1) % 4;
        console.log(this.tickCount, "tick", this.fallingBox, this.growingBoxes.length, this.fixedBoxes.length)
        console.log(this.board.slice((this.height - 1 ) * this.width))
        if (this.tickCount == 0 && this.fallingBox) {
            if (!this.canFall(this.fallingBox)) {
                this.fixedBoxes.push(this.fallingBox);
                this.fallingBox = null;
            } else {
                this.moveDown()
            }
        }
        if (this.growingBoxes.length > 0) {
            for (let i = 0; i < this.growingBoxes.length; ++i) {
                if (this.growingBoxes[i].state !== BoxState.ACTIVE) {
                    continue;
                }
                this.growBox(this.growingBoxes[i])
            }
        }
        if (this.tickCount == 0 && this.running) {
            this.gravityTick = (this.gravityTick + 1) % 2
            let didGravity = false;
            do {
                didGravity = false;
                for (let i = 0; i < this.fixedBoxes.length; ++i) {
                    const box = this.fixedBoxes[i];
                    if (box.state !== BoxState.ACTIVE) {
                        if (box.state == BoxState.NEW) {
                            box.lastGravity = this.gravityTick;
                        }
                        continue;
                    }
                    if (this.gravityTick != box.lastGravity && this.canFall(box)) {
                        box.lastGravity = this.gravityTick;
                        didGravity = true;
                        this.removeBoxFromBoard(box);
                        box.y += 1;
                        this.insertBoxIntoBoard(box)
                        if (this.checkTouching(box)) {
                            break;
                        }
                    }
                }
            } while(didGravity);
            if (!this.fallingBox) {
                this.nextBox();
                for (let i = 0; i < this.fallingBox.height; ++i) {
                    for (let j = 0; j < this.fallingBox.width; ++j) {
                        if (this.board[(this.fallingBox.y + i) * this.width + this.fallingBox.x + j]) {
                            this.running = false;
                            clearInterval(this.interval);
                            console.log("Game over");
                            return;
                        }
                    }
                }
                this.fallingBox.state = BoxState.ACTIVE
                this.insertBoxIntoBoard(this.fallingBox)
            }
        }
        this.switchBoxStatesForNextTick(this.fixedBoxes)
        this.switchBoxStatesForNextTick(this.growingBoxes)

        if (VALIDATION) {
            for (let y = 0; y < GAME_HEIGHT; ++y) {
                for (let x = 0; x < GAME_WIDTH; ++x) {
                    const cell = this.board[y * this.width + x];
                    if (cell) {
                        if (cell !== null) {
                            if (cell.x <= x && x <= cell.rightX() && cell.y <= y && y <= cell.bottomY()) {

                            } else {
                                throw new Error("Found box in board at wrong place")
                            }
                            if (cell.state !== BoxState.ACTIVE && cell.state !== BoxState.NEW) {
                                throw new Error("Found box in board that is not active or new");
                            }
                        } else {
                            throw new Error("Found sumething truthy that is null?")
                        }
                    }
                }
            }
            for (let i = 0; i < this.fixedBoxes.length; ++i) {
                const box = this.fixedBoxes[i];
                for (let y = box.y; y <= box.bottomY(); ++y) {
                    for (let x = box.x; x <= box.rightX(); ++x) {
                        if (this.board[y * this.width + x] != box) {
                            throw new Error("Box in fixedBoxes is not placed in board at x+" + x +" y=" + y)
                        }
                    }
                }
            }
            for (let i = 0; i < this.growingBoxes.length; ++i) {
                const box = this.growingBoxes[i];
                for (let y = box.y; y <= box.bottomY(); ++y) {
                    for (let x = box.x; x <= box.rightX(); ++x) {
                        if (this.board[y * this.width + x] != box) {
                            throw new Error("Growing box not in board at x+" + x +" y=" + y)
                        }
                    }
                }
            }
        }
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
function test_neighbors() {
    const state = new GameState(5, 5)
    const l1 = new Box(0, 1, 1, 1, 1);
    const l2 = new Box(0, 2, 1, 1, 1);
    const l3 = new Box(0, 3, 1, 1, 1);
    const l = [l1, l2, l3];
    const r1 = new Box(4, 1, 1, 1, 1);
    const r2 = new Box(4, 2, 1, 1, 1);
    const r3 = new Box(4, 3, 1, 1, 1);
    const r = [r1, r2, r3];
    const t1 = new Box(1, 0, 1, 1, 1);
    const t2 = new Box(2, 0, 1, 1, 1);
    const t3 = new Box(3, 0, 1, 1, 1);
    const t = [t1, t2, t3];
    const b1 = new Box(1, 4, 1, 1, 1);
    const b2 = new Box(2, 4, 1, 1, 1);
    const b3 = new Box(3, 4, 1, 1, 1);
    const b = [b1, b2, b3];
    [l, r, t, b].forEach(arr => {
        arr.forEach(box => {
            state.insertFixedBoxIntoBoard(box)
        });
    });
    [l, r, t, b].forEach(arr => {
        arr.forEach(box => {
            state.setFixedNeighbors(box)
        });
    });

    const box = new Box(1, 1, 3, 3, 3);
    state.insertFixedBoxIntoBoard(box)
    state.setFixedNeighbors(box)
    compare_test(state.getBottomNeighbors(box), b, "bottom", box);
    compare_test(state.getTopNeighbors(box), t, "top", box);
    compare_test(state.getLeftNeighbors(box), l, "left", box);
    compare_test(state.getRightNeighbors(box), r, "right", box);

    for (const box of l) {
        compare_test(box.neighbors_l, [WALL], "wall left", box)
    }
    for (const box of r) {
        compare_test(box.neighbors_r, [WALL], "wall right", box)
    }
    for (const box of t) {
        compare_test(box.neighbors_t, [WALL], "wall top", box)
    }
    for (const box of b) {
        compare_test(box.neighbors_b, [WALL], "wall bottom", box)
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
}
