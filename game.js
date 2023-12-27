const groundBox = new Object()

class Box {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.fixedIndex = null;
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
        this.gravityBoxes = [];
        this.growingBoxes = [];
        this.running = false;
    }

    start() {
        this.running = true;
        this.interval = setInterval(this.nextTick.bind(this), 500);
    }

    nextBox() {
        if (this.fallingBox) {
            throw "Invalid state. Already have falling box";
        }
        const size = 1 + Math.floor(Math.random() * 4)
        this.fallingBox = new Box(Math.floor(this.width / 2) - Math.floor(size / 2), 0, size);
    }

    canFall(box) {
        if (box.y + box.size == this.height) {
            return false;
        }
        const h = (box.y + box.size) * this.width
        for (let x = box.x; x < box.x + box.size; ++x) {
            if (this.board[h + x]) {
                return false;
            }
        }
        return true;
    }

    insertBoxIntoBoard(box) {
        if (box.fixedIndex !== null) {
            throw "Box is already in board"
        }
        this.fixedBoxes.push(box)
        box.fixedIndex = this.fixedBoxes.length - 1
        for (let i = 0; i < box.size; ++i) {
            for (let j = 0; j < box.size; ++j) {
                this.board[(box.y + i) * this.width + box.x + j] = box;
            }
        }
    }

    removeBoxFromBoard(box) {
        if (box.fixedIndex === null) return
        if (box.fixedIndex == this.fixedBoxes.length - 1) {
            this.fixedBoxes.pop()
        } else {
            const swapBox = this.fixedBoxes.pop()
            swapBox.fixedIndex = box.fixedIndex
            this.fixedBoxes[box.fixedIndex] = swapBox
        }
        box.fixedIndex = null;
        for (let i = 0; i < box.size; ++i) {
            for (let j = 0; j < box.size; ++j) {
                this.board[(box.y + i) * this.width + box.x + j] = null;
            }
        }
    }

    getNeighbors(start, stride, end) {
        const neighbors = [];
        if (start < this.board.length && end >= 0) {
            end = Math.min(end, this.board.length)
            for (let pos = start; pos < end; pos += stride) {
                if (0 <= pos && pos <= this.board.length && this.board[pos]) {
                    neighbors.push(this.board[pos]);
                }
            }
        }
        return neighbors;
    }

    getTopNeighbors(box) {
        return this.getNeighbors((box.y - 1) * this.width + box.x, 1, (box.y - 1) * this.width + box.size);
    }

    getBottomNeighbors(box) {
        return this.getNeighbors((box.y + box.size) * this.width + box.x, 1, (box.y + box.size) * this.width + box.size);
    }

    getLeftNeighbors(box) {
        return this.getNeighbors(box.y * this.width + box.x - 1, this.width, (box.y + box.size) * this.width);
    }

    getRightNeighbors(box) {
        return this.getNeighbors(box.y * this.width + box.x + box.size, this.width, (box.y + box.size) * this.width);
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

    combineBoxes(boxes) {
        let center_x = 0;
        let center_y = 0;
        boxes.forEach(box => {
            center_x += box.x;
            center_y += box.y;
            this.removeBoxFromBoard(box)
        })
        const newsize = boxes[0].size + boxes.length - 1;
        if (newsize > 11) {
            return
        }
        const newBox = new Box(Math.round(center_x / boxes.length), Math.round(center_y / boxes.length), 1);
        newBox.targetSize = newsize;
        this.growingBoxes.push(newBox)
    }

    move(direction) {
        if (this.fallingBox) {
            const newx = Math.max(0, Math.min(this.width - this.fallingBox.size, this.fallingBox.x + direction))
            if (this.fallingBox.x != newx) {
                this.fallingBox.x = newx;
                const touching = this.getSameSizeTouchingBoxes(this.fallingBox);
                if (touching.length > 0) {
                    this.combineBoxes(touching);
                    this.fallingBox = null;
                }
            }
        }
    }

    moveDown() {
        if (this.fallingBox) {
            if (this.canFall(this.fallingBox)) {
                this.fallingBox.y += 1
                const touching = this.getSameSizeTouchingBoxes(this.fallingBox);
                if (touching.length > 0) {
                    this.combineBoxes(touching);
                    this.fallingBox = null;
                }
            }
        }
    }

    growBox(box) {

    }

    nextTick() {
        console.log("tick", this.fallingBox, this.gravityBoxes, this.fixedBoxes)
        console.log(this.board.slice((this.height - 1 ) * this.width))
        if (this.fallingBox) {
            if (this.canFall(this.fallingBox)) {
                this.fallingBox.y +=1;
                const touching = this.getSameSizeTouchingBoxes(this.fallingBox);
                if (touching.length > 0) {
                    console.log("Falling box touched something")
                    this.combineBoxes(touching)
                    this.fallingBox = null;
                }
            } else {
                this.insertBoxIntoBoard(this.fallingBox);
                this.fallingBox = null;
            }
        } else if (this.growingBoxes.length > 0) {
            for (let i = 0; i < this.growingBoxes.length; ++i) {
                this.growBox(this.growingBoxes[i])
            }
        } else if (this.gravityBoxes.length > 0) {
            console.log("Mutliple boxes are falling")
            for (let i = 0; i < this.gravityBoxes.length; ++i) {
                let box = this.gravityBoxes[i];
                if (this.canFall(box)) {
                    box.y += 1;
                    const touching = this.getSameSizeTouchingBoxes(this.fallingBox);
                    if (touching.length > 0) {
                        this.combineBoxes(touching);
                    }
                } else {
                    this.insertBoxIntoBoard(box)
                    swapOut(this.gravityBoxes, i)
                    --i;
                }
            }
        } else if (this.running) {
            this.nextBox();
        }
    }
}