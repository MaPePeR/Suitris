const groundBox = new Object()

const VALIDATION = true;
WALL = "WALL!!";

const ALLOW_PUSH = true;

class Box {
    constructor(x, y, size, width, height) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.width = width;
        this.height = height;
        this.fixedIndex = null;
        this.neighbors_t = [];
        this.neighbors_b = [];
        this.neighbors_l = [];
        this.neighbors_r = [];
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

    insertBoxIntoBoard(box) {
        if (!(box instanceof GrowingBox)) {
            if (box.fixedIndex !== null) {
                throw "Box is already in board"
            }
            this.fixedBoxes.push(box)
            box.fixedIndex = this.fixedBoxes.length - 1
        }
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
        this.setFixedNeighbors(box)
    }

    removeBoxFromBoard(box) {
        const oldIndex = box.fixedIndex;
        if (box.fixedIndex !== null) {
            if (box.fixedIndex == this.fixedBoxes.length - 1) {
                this.fixedBoxes.pop()
            } else {
                const swapBox = this.fixedBoxes.pop()
                swapBox.fixedIndex = box.fixedIndex
                this.fixedBoxes[box.fixedIndex] = swapBox
            }
        } else {
            console.warn("Removing box from board that does not have fixed index");
            if (VALIDATION) {
                if (this.fixedBoxes.indexOf(box) !== -1) {
                    throw new Error("Box to remove does not have fixed index, but is in fixedBoxes");
                }
            }
        }
        box.fixedIndex = null;
        for (let i = 0; i < box.height; ++i) {
            for (let j = 0; j < box.width; ++j) {
                if (VALIDATION) {
                    const cell = this.board[(box.y + i) * this.width + box.x + j]
                    if (cell !== box) {
                        if (oldIndex !== null && cell != null) {
                            throw new Error("Box in board does not match box to remove at x=" + (box.x + j) + " y=" + (box.y + i))
                        }
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
                this.fallingBox.x = newx;
                if (didshift) {
                    this.fixedBoxes.forEach((box) => this.setFixedNeighbors(box)); // TODO only update neighbors that need updating
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
                this.fallingBox.y += 1
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
        this.fixedBoxes.forEach((box) => this.setFixedNeighbors(box)); // TODO only update neighbors that need updating
        this.setFixedNeighbors(box)
        this.removeBoxFromBoard(box)
        if (box.width * box.height >= box.size * box.size) {
            this.insertBoxIntoBoard(new Box(box.x, box.y, box.size, box.width, box.height));
            this.growingBoxes.splice(this.growingBoxes.indexOf(box), 1) // TODO Remove growing box without searching
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
            this.growingBoxes.splice(this.growingBoxes.indexOf(box), 1) // TODO Remove growing box without searching
        } else {
            this.insertBoxIntoBoard(box)
        }
        //TODO Option to move the box itself upwards if it cannot grow in width
    }
    growBoxX(box) {
        const free_left = box.neighbors_l.length == 0;
        const free_right = box.neighbors_r.length == 0;
        const preferLeft = box.center_x < box.x + box.width / 2;
        if (preferLeft && (free_left || (!free_left && !free_right && this.shift(box.neighbors_l, 'x', -1, 'neighbors_l')))) {
            if (VALIDATION && this.getLeftNeighbors(box).length > 0) throw "Growing left, but neighbors exist";
            box.width += 1;
            box.x -= 1;
        } else if (free_right || (!free_left && !free_right && this.shift(box.neighbors_r, 'x', 1, 'neighbors_r'))) {
            if (VALIDATION && this.getRightNeighbors(box).length > 0) throw "Growing left, but neighbors exist";
            box.width += 1;
        } else if (!preferLeft && (free_left || (!free_left && !free_right && this.shift(box.neighbors_l, 'x', -1, 'neighbors_l')))) {
            if (VALIDATION && this.getLeftNeighbors(box).length > 0) throw "Growing left, but neighbors exist";
            box.width += 1;
            box.x -= 1;
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
            box.height += 1;
            box.y -= 1;
            return true;
        }
        if (free_bottom || (!free_top && !free_bottom && this.shift(box.neighbors_b, 'y', 1, 'neighbors_b'))) {
            // Bottom is free
            box.height += 1;
            return true;
        }
        if (!prefer_top && (free_top || (!free_top && !free_bottom && this.shift(box.neighbors_t, 'y', -1, 'neighbors_t')))) {
            // Top is free
            box.height += 1;
            box.y -= 1;
            return true;
        }
    }

    nextTick() {
        this.tickCount = (this.tickCount + 1) % 4;
        console.log(this.tickCount, "tick", this.fallingBox, this.growingBoxes.length, this.fixedBoxes.length)
        console.log(this.board.slice((this.height - 1 ) * this.width))
        if (this.tickCount == 0 && this.fallingBox) {
            if (!this.canFall(this.fallingBox)) {
                this.insertBoxIntoBoard(this.fallingBox);
                this.fallingBox = null;
            } else {
                this.moveDown()
            }
        }
        if (this.fallingBox) {
            this.insertBoxIntoBoard(this.fallingBox);
        }
        if (this.growingBoxes.length > 0) {
            for (let i = 0; i < this.growingBoxes.length; ++i) {
                this.growBox(this.growingBoxes[i])
            }
        }
        if (this.fallingBox) {
            this.removeBoxFromBoard(this.fallingBox);
        }
        if (this.tickCount == 0 && this.running) {
            let didGravity = false;
            for (let i = 0; i < this.fixedBoxes.length; ++i) {
                const box = this.fixedBoxes[i];
                if (this.canFall(box)) {
                    this.removeBoxFromBoard(box);
                    box.y += 1;
                    this.insertBoxIntoBoard(box)
                    if (this.checkTouching(box)) {
                        break;
                    }
                    didGravity = true;
                }
            }
            if (!this.fallingBox && !didGravity && this.growingBoxes.length == 0) {
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
            }
        }
        if (VALIDATION) {
            for (let y = 0; y < GAME_HEIGHT; ++y) {
                for (let x = 0; x < GAME_WIDTH; ++x) {
                    const cell = this.board[y * this.width + x];
                    if (cell) {
                        if (cell !== null) {
                            const number = cell.fixedIndex;
                            if (cell.x <= x && x <= cell.rightX() && cell.y <= y && y <= cell.bottomY()) {

                            } else {
                                throw new Error("Found box in board at wrong place")
                            }
                            if (number === null) {
                                if (!(cell instanceof GrowingBox)) {
                                    throw new Error("Found box in board with fixedIndex=null")
                                }
                            }
                        } else {
                            throw new Error("Found sumething truthy that is null?")
                        }
                    }
                }
            }
            for (let i = 0; i < this.fixedBoxes.length; ++i) {
                const box = this.fixedBoxes[i];
                if (box.fixedIndex != i) {
                    throw new Error("Found fixed box with wrong index")
                }
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
            state.insertBoxIntoBoard(box)
        });
    });
    [l, r, t, b].forEach(arr => {
        arr.forEach(box => {
            state.setFixedNeighbors(box)
        });
    });

    const box = new Box(1, 1, 3, 3, 3);
    state.insertBoxIntoBoard(box)
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
