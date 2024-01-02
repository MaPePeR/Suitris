const VALIDATION = true;

const ALLOW_PUSH = true;

const BoxState = {
    NEW: "NEW",
    ACTIVE: "ACTIVE",
    TO_BE_REMOVED: "TO_BE_REMOVED",
    REMOVED: "REMOVED",
}

let boxcount = 0;
class Box {
    constructor(x, y, size, width, height) {
        this.id = boxcount++;
        this.x = x;
        this.y = y;
        this.center_x = width / 2;
        this.center_y = height / 2;
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

    *allNeigbors() {
        for(const n of this.neighbors_t) {
            yield n
        }
        for(const n of this.neighbors_b) {
            yield n
        }
        for(const n of this.neighbors_l) {
            yield n
        }
        for(const n of this.neighbors_r) {
            yield n
        }
    }
}

function swapOut(arr, idx) {
    if (idx == arr.length - 1) {
        arr.pop()
    } else {
        arr[idx] = arr.pop()
    }
}

function swapOutEl(arr, el) {
    const idx = arr.indexOf(el);
    if (idx < 0) return;
    swapOut(arr, idx);
}

function fillArrFromGen(arr, gen) {
    arr.length = 0;
    for (let obj of gen) {
        arr.push(obj)
    }
}

class GameState {
    constructor(width, height, renderer) {
        this.width = width;
        this.height = height;
        this.board = new Array(width * height);
        this.board.fill(null)
        this.fixedBoxes = [];
        this.fallingBox = null;
        this.growingBoxes = [];
        this.nonSquareBoxes = [];
        this.running = false;
        this.tickCount = 0;
        this.gravityTick = 0;
        this.renderer = renderer;
        this.upcomingSize = this.randomSize();

        this.shiftTop = this.shiftDirTemplate('y', -1, 'height', this.height, 'neighbors_t');
        this.shiftBottom = this.shiftDirTemplate('y', 1, 'height', this.height, 'neighbors_b');
        this.shiftLeft = this.shiftDirTemplate('x', -1, 'width', this.width, 'neighbors_l');
        this.shiftRight = this.shiftDirTemplate('x', 1, 'width', this.width, 'neighbors_r');

        [this.extendBoxTop, this.shrinkFromTop] = this.changeBoxSizeDirectionTemplate(
            this.getTopIndices.bind(this),
            this.getTopCorners.bind(this),
            'neighbors_t', 'neighbors_b',
            'neighbors_l', 'neighbors_r',
            (box, other) => other.y <= box.y + box.height & other.y + other.height > box.y,
            (box) => {
                box.height += 1;
                box.y -= 1;
                box.center_y  += 1
            },
            (box) => {
                box.height -= 1;
                box.y += 1;
                box.center_y -= 1;
            }
        );
        [this.extendBoxBottom, this.shrinkFromBottom] = this.changeBoxSizeDirectionTemplate(
            this.getBottomIndices.bind(this),
            this.getBottomCorners.bind(this),
            'neighbors_b', 'neighbors_t',
            'neighbors_l', 'neighbors_r',
            (box, other) => other.y <=box.y + box.height & other.y + other.height > box.y,
            (box) => {
                box.height += 1;
            },
            (box) => {
                box.height -= 1;
            }
        );
        [this.extendBoxLeft, this.shrinkFromLeft] = this.changeBoxSizeDirectionTemplate(
            this.getLeftIndices.bind(this),
            this.getLeftCorners.bind(this),
            'neighbors_l', 'neighbors_r',
            'neighbors_t', 'neighbors_b',
            (box, other) => other.x < box.x + box.width && other.x + other.width > box.x,
            (box) => {
                box.width += 1;
                box.x -= 1;
                box.center_x  += 1
            },
            (box) => {
                box.width -= 1;
                box.x += 1;
                box.center_x -= 1;
            }
        );
        [this.extendBoxRight, this.shrinkFromRight] = this.changeBoxSizeDirectionTemplate(
            this.getRightIndices.bind(this),
            this.getRightCorners.bind(this),
            'neighbors_r', 'neighbors_l',
            'neighbors_t', 'neighbors_b',
            (box, other) => other.x < box.x + box.width && other.x + other.width > box.x,
            (box) => {
                box.width += 1;
            },
            (box) => {
                box.width -= 1;
            }
        );
    }

    start() {
        this.running = true;
        this.interval = setInterval(this.nextTick.bind(this), 500 / 4);
    }

    randomSize() {
        return 1 + Math.floor(Math.random() * 4)
    }

    nextBox() {
        if (this.fallingBox) {
            throw "Invalid state. Already have falling box";
        }
        const size = this.upcomingSize
        this.fallingBox = new Box(Math.floor(this.width / 2) - Math.floor(size / 2), 0, size, size, size);
        this.upcomingSize = this.randomSize()
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
        }
        this.fixedBoxes.push(box)
        this.insertBoxIntoBoard(box)
    }

    insertBoxIntoBoard(box) {
        if (box.y < 0 || box.x < 0 || box.x + box.width > this.width || box.y + box.height > this.height) {
            throw new Error("Box outside of board")
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
        for(const other of box.neighbors_t) {
            other.neighbors_b.push(box)
        }
        for(const other of box.neighbors_b) {
            other.neighbors_t.push(box)
        }
        for(const other of box.neighbors_l) {
            other.neighbors_r.push(box)
        }
        for(const other of box.neighbors_r) {
            other.neighbors_l.push(box)
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
        for(const other of box.neighbors_t) {
            swapOutEl(other.neighbors_b, box)
        }
        for(const other of box.neighbors_b) {
            swapOutEl(other.neighbors_t, box)
        }
        for(const other of box.neighbors_l) {
            swapOutEl(other.neighbors_r, box)
        }
        for(const other of box.neighbors_r) {
            swapOutEl(other.neighbors_l, box)
        }
    }

    changeBoxSizeDirectionTemplate(getIndicesInDirection, getCornerIndicesInDirection, neighbor_param, reverse_neighbor_param, other_neighbor_param, reverse_other_neighbor_param, touchInCrossDirection, updateExtend, updateShrink) {
        const extendInDirection = (box) => {
            if (VALIDATION) {
                if ([...this.getUniqueBoxesFromIndices(getIndicesInDirection(box))].length > 0) {
                    throw new Error("Extending box, but have existing neighbors in that direction");
                }
            }
            for (const i of getIndicesInDirection(box)) {
                if (VALIDATION) {
                    const cell = this.board[i]
                    if (cell !== null) {
                        throw new Error(`Board is not empty at i=${i} x=${i % this.width} y=${Math.floor(i / this.width)}`)
                    }
                }
                this.board[i] = box;
            }
            // returns TOP, BOTTOM or LEFT, RIGHT corners
            const corners = getCornerIndicesInDirection(box)
            const corner1 = corners.next().value
            if (corner1 !== null) {
                const other = this.board[corner1]
                if (other && !touchInCrossDirection(box, other)) {
                    other[reverse_other_neighbor_param].push(box)
                    box[other_neighbor_param].push(other)
                }
            }
            const corner2 = corners.next().value
            if (corner2 !== null) {
                const other = this.board[corner2]
                if (other && !touchInCrossDirection(box, other)) {
                    other[other_neighbor_param].push(box)
                    box[reverse_other_neighbor_param].push(other)
                }
            }
            updateExtend(box)
            fillArrFromGen(box[neighbor_param], this.getUniqueBoxesFromIndices(getIndicesInDirection(box)))
            for (const other of box[neighbor_param]) {
                other[reverse_neighbor_param].push(box)
            }
        }

        const shrinkFromDirection = (box) => {
            for (const i of getIndicesInDirection(box)) {
                if (VALIDATION) {
                    const cell = this.board[i]
                    if (cell !== box) {
                        throw new Error(`Box in board does not match box to remove at i=${i} x=${i % this.width} y=${Math.floor(i / this.width)}`)
                    }
                }
                this.board[i] = null;
            }
            updateShrink(box)
            for (const other of box[neighbor_param]) {
                swapOutEl(other[reverse_neighbor_param], box)
            }
            // returns TOP, BOTTOM or LEFT, RIGHT corners
            const corners = getCornerIndicesInDirection(box)
            const corner1 = corners.next().value
            if (corner1 !== null) {
                const other = this.board[corner1]
                if (other && !touchInCrossDirection(box, other)) {
                    swapOutEl(other[reverse_other_neighbor_param], box)
                    swapOutEl(box[other_neighbor_param], other)
                }
            }
            const corner2 = corners.next().value
            if (corner2 !== null) {
                const other = this.board[corner2]
                if (other && !touchInCrossDirection(box, other)) {
                    swapOutEl(other[other_neighbor_param], box)
                    swapOutEl(box[reverse_other_neighbor_param], other)
                }
            }
        }
        return [extendInDirection, shrinkFromDirection]
    }

    *getIndices(start, stride, end) {
        if (start < 0 || end > this.board.length + stride - 1) {
            throw new Error("Indices are outside of range")
        }
        for (let pos = start; pos < end; pos += stride) {
            yield pos;
        }
    }

    *getCornerIndices(box, dx, dy) {
        if (dx !== 0) {
            if (box.x + dx < 0 || box.x + dx + box.width >= this.width) {
                yield null
                yield null
            }
            yield (box.y > 0) ? (box.y - 1) * this.width + box.x + dx : null;
            yield (box.y + box.height < this.height) ? (box.y + box.height) * this.width + box.x + box.width + dx : null;
        } else if (dy !== 0) {
            if (box.y + dy < 0 || box.y + dy + box.height >= this.height) {
                yield null
                yield null
            }
            yield (box.x > 0) ? (box.y + dy) * this.width + box.x - 1 : null;
            yield (box.x + box.width < this.width) ? (box.y + dy) * this.width + box.x + box.width : null;
        }
    }

    *getUniqueBoxesFromIndices(indices) {
        let lastBox = null;
        for(let i of indices) {
            const box = this.board[i]
            if (box && lastBox !== box) {
                lastBox = box
                yield box
            }
        }
    }

    getTopIndices(box) {
        if (box.y == 0) return [];
        return this.getIndices((box.y - 1) * this.width + box.x, 1, (box.y - 1) * this.width + box.rightX() + 1);
    }

    getBottomIndices(box) {
        if (box.y + box.height >= this.height) return [];
        return this.getIndices((box.bottomY() + 1) * this.width + box.x, 1, (box.bottomY() + 1) * this.width + box.rightX() + 1);
    }

    getLeftIndices(box) {
        if (box.x == 0) return [];
        return this.getIndices(box.y * this.width + box.x - 1, this.width, (box.bottomY() + 1) * this.width + box.x - 1);
    }

    getRightIndices(box) {
        if (box.rightX() + 1 >= this.width) return [];
        return this.getIndices(box.y * this.width + box.rightX() + 1, this.width, (box.bottomY() + 1) * this.width + box.rightX() + 1);
    }

    getTopCorners(box) {
        return this.getCornerIndices(box, 0, -1);
    }

    getBottomCorners(box) {
        return this.getCornerIndices(box, 0, 1);
    }

    getLeftCorners(box) {
        return this.getCornerIndices(box, -1, 0);
    }

    getRightCorners(box) {
        return this.getCornerIndices(box, 1, 0);
    }

    getTopNeighbors(box) {
        return this.getUniqueBoxesFromIndices(this.getTopIndices(box));
    }

    getBottomNeighbors(box) {
        return this.getUniqueBoxesFromIndices(this.getBottomIndices(box))
    }

    getLeftNeighbors(box) {
        return this.getUniqueBoxesFromIndices(this.getLeftIndices(box))
    }

    getRightNeighbors(box) {
        return this.getUniqueBoxesFromIndices(this.getRightIndices(box))
    }

    getSameSizeTouchingBoxes(box) {
        // TODO: Only touching if touching along half of their size
        const touching = [];
        for(const other of box.allNeigbors()) {
            if (other.size == box.size) {
                touching.push(other);
            }
        }
        if (touching.length > 0) {
            touching.push(box)
            console.log("Touching", touching)
        }
        return touching
    }

    setFixedNeighbors(box) {
        this.setFixedTopNeighbors(box)
        this.setFixedBottomNeighbors(box)
        this.setFixedLeftNeighbors(box)
        this.setFixedRightNeighbors(box)
    }

    setFixedTopNeighbors(box) {
        fillArrFromGen(box.neighbors_t, this.getTopNeighbors(box));
    }

    setFixedBottomNeighbors(box) {
        fillArrFromGen(box.neighbors_b, this.getBottomNeighbors(box));
    }

    setFixedLeftNeighbors(box) {
        fillArrFromGen(box.neighbors_l, this.getLeftNeighbors(box));
    }

    setFixedRightNeighbors(box) {
        fillArrFromGen(box.neighbors_r, this.getRightNeighbors(box));
    }

    combineBoxes(boxes) {
        let center_x = 0;
        let center_y = 0;
        boxes.forEach(box => {
            center_x += box.x + 0.5 * box.width;
            center_y += box.y + 0.5 * box.height;
            this.removeBoxFromBoard(box)
            box.state = BoxState.TO_BE_REMOVED;
            if (box === this.fallingBox) {
                this.fallingBox = null;
            }
        })
        const newsize = boxes[0].size + boxes.length - 1;
        if (newsize > 11) {
            return
        }
        center_x /= boxes.length;
        center_y /= boxes.length;
        let newx = null;
        let newy = null;
        let closestDistance = Infinity
        for (const box of boxes) {
            if (box.x <= center_x && center_x < box.x + box.width && box.y <= center_y && center_y < box.y + box.height) {
                // center is inside this box.
                newx = center_x;
                newy = center_y;
                break;
            } else {
                // Distance point to box from https://stackoverflow.com/a/18157551/2256700
                const dx = Math.max(box.x - center_x, 0, center_x - (box.x + box.width));
                const dy = Math.max(box.y - center_y, 0, center_y - (box.y + box.height));
                const distance = dx*dx + dy*dy;
                if (distance < closestDistance) {
                    closestDistance = distance
                                            /* Center is Right/Below              Center is left/above  else Center is inbetween */
                    newx = center_x + (box.x + box.width  <= center_x ? -1 : (center_x < box.x ? 1 : 0)) * (dx + 0.5);
                    newy = center_y + (box.y + box.height <= center_y ? -1 : (center_y < box.y ? 1 : 0)) * (dy + 0.5);
                    if (VALIDATION) {
                        if (!(box.x <= newx && newx < box.x + box.width  && box.y <= newy && newy < box.y + box.height)) {
                            throw new Error("Calculted point is not in box");
                        }
                    }
                }
            }
        }
        if (newx === null || newy === null) {
            throw new Error("Failed to create growing box");
        }
        const newBox = new Box(Math.floor(newx), Math.floor(newy), newsize, 1, 1);
        newBox.center_x = newx - newBox.x;
        newBox.center_y = newy - newBox.y;
        this.growingBoxes.push(newBox)
        this.insertBoxIntoBoard(newBox)
    }

    move(direction) {
        if (this.running && this.fallingBox) {
            const newx = Math.max(0, Math.min(this.width - this.fallingBox.width, this.fallingBox.x + direction))
            if (this.fallingBox.x != newx) {
                let didshift = false;
                if (direction < 0 && this.fallingBox.neighbors_l.length > 0) {
                    if (ALLOW_PUSH && this.shiftLeft(this.fallingBox.neighbors_l)) {
                        didshift = true;
                    } else {
                        return;
                    }
                }
                if (direction > 0 && this.fallingBox.neighbors_r.length > 0) {
                    if (ALLOW_PUSH && this.shiftRight(this.fallingBox.neighbors_r)) {
                        didshift = true;
                    } else {
                        return;
                    }
                }
                this.removeBoxFromBoard(this.fallingBox)
                this.fallingBox.x = newx;
                this.insertBoxIntoBoard(this.fallingBox)
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
        if (box.state == BoxState.TO_BE_REMOVED || box.state == BoxState.REMOVED) {
            console.warn("Checking box for touching that is not active anymore", box)
            return;
        }
        const touching = this.getSameSizeTouchingBoxes(box);
        if (touching.length > 0) {
            this.combineBoxes(touching)
            return true;
        } else {
            return false;
        }
    }

    shiftDirTemplate(dir_param, dir, dir_size_param, dir_size, neighbor_param) {
        function r_shift(boxes, nextBoxes, boxes_to_shift) {
            if (boxes.length == 0) {
                return true;
            }
            for (const box of boxes) {
                if (box[dir_param] + dir < 0 || box[dir_param] + dir + box[dir_size_param] > dir_size) {
                    return false;
                }
                for (const neighbor of box[neighbor_param]) {
                    nextBoxes.push(neighbor);
                }
                boxes_to_shift.add(box);
            }
            boxes.length = 0;
            return r_shift(nextBoxes, boxes, boxes_to_shift);
        };
        return (boxes) => {
            const boxes_to_shift = new Set();
            if (r_shift([...boxes], [], boxes_to_shift)) {
                //TODO reverse order and shift without removing full box
                boxes_to_shift.forEach(box => {
                    this.removeBoxFromBoard(box)
                    box[dir_param] += dir;
                });
                boxes_to_shift.forEach(box => {
                    this.insertBoxIntoBoard(box)
                });
                boxes_to_shift.forEach(box => {
                    this.checkTouching(box)
                })
                return true;
            }
            return false;
        }
    }

    growBox(box) {
        if (VALIDATION) {
            if (box.state !== BoxState.ACTIVE) {
                throw new Error("Cannot grow non active box");
            }
        }
        if (box.width * box.height >= box.size * box.size) {
            this.removeBoxFromBoard(box)
            box.state = BoxState.TO_BE_REMOVED
            const newbox = new Box(box.x, box.y, box.size, box.width, box.height)
            this.insertFixedBoxIntoBoard(newbox);
            if (newbox.width !== newbox.height) {
                this.nonSquareBoxes.push(newbox);
            }
            return;
        }
        if (this.growBoxX(box)) {
            console.log("GrowX successful", box)
        } else {
            console.log("GrowX failed", box)
        }
        if (box.height * box.width < box.size * box.size) {
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
        const preferLeft = box.center_x < box.width / 2;
        return (preferLeft && this.growBoxLeft(box))
            || this.growBoxRight(box)
            || (!preferLeft && this.growBoxLeft(box));
    }

    growBoxLeft(box) {
        if (box.x == 0) return false;
        const free_left = box.neighbors_l.length == 0;
        const free_right = box.neighbors_r.length == 0 && box.x + box.width < this.width;
        if (free_left || (!free_left && !free_right && this.shiftLeft(box.neighbors_l))) {
            this.extendBoxLeft(box)
            return true;
        }
        return false;
    }

    growBoxRight(box) {
        if (box.x + box.width >= this.width) return false;
        const free_left = box.neighbors_l.length == 0 && box.x > 0;
        const free_right = box.neighbors_r.length == 0;
        if (free_right || (!free_left && !free_right && this.shiftRight(box.neighbors_r))) {
            this.extendBoxRight(box)
            return true;
        }
        return false;
    }

    growBoxY(box) {
        const prefer_top = box.height / 2 > box.center_y;
        return (prefer_top && this.growBoxTop(box))
            || this.growBoxBottom(box)
            || (!prefer_top && this.growBoxTop(box));
    }

    growBoxTop(box) {
        if (this.y == 0) return false;
        const free_top = box.neighbors_t.length == 0;
        const free_bottom = box.neighbors_b.length == 0 && box.y + box.height < this.height;
        if (free_top || (!free_top && !free_bottom && this.shiftTop(box.neighbors_t))) {
            this.extendBoxTop(box)
            return true;
        }
        return false;
    }

    growBoxBottom(box) {
        if (box.y + box.height >= this.height) return false;
        const free_top = box.neighbors_t.length == 0 && this.y > 0;
        const free_bottom = box.neighbors_b.length == 0;
        if (free_bottom || (!free_top && !free_bottom && this.shiftBottom(box.neighbors_b))) {
            this.extendBoxBottom(box)
            return true;
        }
        return false;
    } 

    shrinkToSquare(box) {
        if (box.width < box.size) {
            this.growBoxX(box);
            this.checkTouching(box)
        }
        else if (box.height < box.size) {
            this.growBoxY(box);
            this.checkTouching(box)
        }
        if (box.state === BoxState.TO_BE_REMOVED) {
            return;
        }
        if (box.width > box.size && (box.width - 1) * box.height >= box.size * box.size) {
            const shrinkLeft = box.center_x > box.width / 2;
            if (shrinkLeft) {
                this.shrinkFromLeft(box)
            } else {
                this.shrinkFromRight(box)
            }
        } else if (box.height > box.size && box.width * (box.height - 1) >= box.size * box.size) {
            this.shrinkFromTop(box)
        }
    }

    switchBoxStatesForNextTick(arr) {
        for (let i = 0; i < arr.length; ++i) {
            if (arr[i].state === BoxState.TO_BE_REMOVED || arr[i].state == BoxState.REMOVED) {
                arr[i].state == BoxState.REMOVED;
                swapOut(arr, i);
                --i;
            } else if (arr[i].state === BoxState.NEW) {
                arr[i].state = BoxState.ACTIVE;
            }
        }
    }

    nextTick() {
        this.tickCount = this.tickCount + 1;
        console.log(this.tickCount, "tick", this.fallingBox, this.growingBoxes.length, this.fixedBoxes.length)
        console.log(this.board.slice((this.height - 1 ) * this.width))
        if (this.tickCount % 4 == 0 && this.fallingBox) {
            if (!this.canFall(this.fallingBox)) {
                this.fixedBoxes.push(this.fallingBox);
                this.fallingBox = null;
            } else {
                this.moveDown()
            }
        }
        if (this.nonSquareBoxes.length > 0) {
            for (let i = 0; i < this.nonSquareBoxes.length; ++i) {
                const box = this.nonSquareBoxes[i];
                if (box.width == box.height) {
                    swapOut(this.nonSquareBoxes, i)
                    --i;
                } else {
                    this.shrinkToSquare(box);
                }
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
        if (this.tickCount % 4 == 0 && this.running) {
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
                            this.renderer.gameOver();
                            return;
                        }
                    }
                }
                this.fallingBox.state = BoxState.ACTIVE
                this.insertBoxIntoBoard(this.fallingBox)
            }
        }
        this.renderer.render(this)
        this.switchBoxStatesForNextTick(this.fixedBoxes)
        this.switchBoxStatesForNextTick(this.growingBoxes)
        this.switchBoxStatesForNextTick(this.nonSquareBoxes)

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
            function checkNoNeighborTwice(neighbors) {
                for(let i = 0; i < neighbors.length; ++i) {
                    if (neighbors.indexOf(neighbors[i], i+1) >= 0) {
                        throw new Error("Neighbor is contained twice.")
                    }
                }
            }
            for (const box of [...this.fixedBoxes, ...this.growingBoxes]) {
                checkNoNeighborTwice(box.neighbors_t)
                checkNoNeighborTwice(box.neighbors_b)
                checkNoNeighborTwice(box.neighbors_l)
                checkNoNeighborTwice(box.neighbors_r)
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
}
