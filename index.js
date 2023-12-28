const GAME_WIDTH = 15
const GAME_HEIGHT = 20
const sizes = [1,2,3,4,5,6,7,8,9,10,11]
const colors = [
    '#ff2813ff',
    '#ff0059ff',
    '#9e13ffff',
    '#ffd313ff',
    '#ff7313ff',
    '#ff1318ff',
    '#00ff69ff',
    '#ff5fd4ff',
    '#b4ff13ff',
    '#00d654ff',
    '#028000ff',
]

const PIX_PER_BOX = 600 / GAME_WIDTH

async function getEl(id) {
    const el = document.getElementById(id)
    if (el) {
        return el;
    }
    throw "Could not find element with id " + id
}

async function getCtx(promise, options) {
    const canvas = await promise
    if (canvas instanceof HTMLCanvasElement) {
        const context = canvas.getContext("2d", options);
        if (context instanceof CanvasRenderingContext2D) {
            return context
        }
    }
    throw "Could not get Context"
}

let current_game = null;

let lastLog = 0
let lastRender = 0

/**
 * 
 * @param CanvasRenderingContext2D ctx 
 * @param Box box 
 */
function drawBox(ctx, box, state) {
    ctx.strokeStyle = 'black'
    ctx.fillStyle = colors[box.size - 1]
    if (state == 'growing') {
        ctx.beginPath();
        ctx.roundRect(box.x * PIX_PER_BOX, box.y * PIX_PER_BOX, box.width * PIX_PER_BOX, box.height * PIX_PER_BOX, [5]);
        ctx.fill()
        ctx.stroke()
    } else {
        ctx.fillRect(box.x * PIX_PER_BOX, box.y * PIX_PER_BOX, box.width * PIX_PER_BOX, box.height * PIX_PER_BOX)
        ctx.strokeRect(box.x * PIX_PER_BOX, box.y * PIX_PER_BOX, box.width * PIX_PER_BOX, box.height * PIX_PER_BOX)
    }
}

document.addEventListener('keydown', (e) => {
    if (!current_game) return;
    if (e.code === "ArrowLeft") {
        current_game.move(-1);
    } else if (e.code === "ArrowRight") {
        current_game.move(1);
    } else if (e.code === "ArrowDown") {
        current_game.moveDown();
    }
    lastRender = 0
});

function setup() {
    const p_canvas_bg = getEl('gamebg');
    const p_canvas_fg = getEl('gamefg');
    const p_context_bg = getCtx(p_canvas_bg, { alpha: false } );
    const p_context_fg = getCtx(p_canvas_fg, null);

    const p_f_draw_fg = (async () => {
        const ctx = await p_context_fg
        return () => {
            if (!current_game) return
            ctx.clearRect(0, 0, GAME_WIDTH * PIX_PER_BOX, GAME_HEIGHT * PIX_PER_BOX)
            if (current_game.fallingBox) {
                drawBox(ctx, current_game.fallingBox, 'falling')
            }
            current_game.gravityBoxes.forEach(box => {
                drawBox(ctx, box, 'gravity')
            });
            current_game.growingBoxes.forEach(box => {
                drawBox(ctx, box, 'growing')
            });
        }
    })();

    const p_f_draw_bg = (async () => {
        const ctx = await p_context_bg
        return () => {
            if (!current_game) return;
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, GAME_WIDTH * PIX_PER_BOX, GAME_HEIGHT * PIX_PER_BOX)
            current_game.fixedBoxes.forEach(box => {
                drawBox(ctx, box, 'fixed')
            })
            /*
            ctx.strokeStyle = 'black';
            for (let y = 0; y < GAME_HEIGHT; ++y ) {
                for (let x = 0; x < GAME_WIDTH; ++x) {
                    const cell = current_game.board[y * GAME_WIDTH + x]
                    if (cell) {
                        ctx.moveTo(x * PIX_PER_BOX, y * PIX_PER_BOX);
                        ctx.lineTo((x+1) * PIX_PER_BOX, (y+1) * PIX_PER_BOX);
                        ctx.moveTo(x * PIX_PER_BOX, (y+1) * PIX_PER_BOX);
                        ctx.lineTo((x+1) * PIX_PER_BOX, y * PIX_PER_BOX);
                        ctx.stroke();
                        ctx.strokeText(cell.fixedIndex + ' ' + cell.size, (x + 0.5) * PIX_PER_BOX, (y + 0.5) * PIX_PER_BOX )
                    }
                }
            }
            */
        }
    })();

    const p_f_render = (async () => {
        const draw_fg = await p_f_draw_fg
        const draw_bg = await p_f_draw_bg
        return function render(timestamp) {
            if (timestamp - lastRender < 42) {
                requestAnimationFrame(render);
                return; // Framerate < 24Hz
            }
            if (timestamp - lastLog > 1000) {
                //console.log("Render...");
                lastLog = timestamp;
            }
            lastRender = timestamp
            draw_fg()
            draw_bg()
            requestAnimationFrame(render);
        }
    })()

    const p_start_button = getEl('startbutton');
    (async () => {
        const button = await p_start_button;
        const f_render = await p_f_render;
        button.addEventListener('click', () => {
            button.style.display = 'none';
            current_game = new GameState(GAME_WIDTH, GAME_HEIGHT);
            current_game.start();
            requestAnimationFrame(f_render)
        })
    })();
}
setup()