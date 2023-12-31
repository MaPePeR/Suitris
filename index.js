const GAME_WIDTH = 24
const GAME_HEIGHT = 32
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

const $game_object = document.getElementById('game');
const $game_svg = $game_object.contentDocument.querySelector('svg');
const $portrait_viewBox_rect = $game_svg.getElementById('portraitViewBox')
const $landscape_viewBox_rect = $game_svg.getElementById('landscapeViewBox')
function handleResize() {
    const width = $game_svg.clientWidth;
    const height = $game_svg.clientHeight;

    const p_viewBox_height = +$portrait_viewBox_rect.getAttribute('height')
    const p_viewBox_width = +$portrait_viewBox_rect.getAttribute('width')
    const p_aspect = p_viewBox_width / p_viewBox_height

    const p_height =  Math.min(height, width / p_aspect)
    const p_width =  p_height * p_aspect
    const p_area = p_width * p_height / (p_viewBox_width * p_viewBox_height)

    const l_viewBox_height = +$landscape_viewBox_rect.getAttribute('height')
    const l_viewBox_width = +$landscape_viewBox_rect.getAttribute('width')
    const l_aspect = l_viewBox_width / l_viewBox_height
    
    const l_height =  Math.min(height, width / l_aspect)
    const l_width = l_height * l_aspect
    const l_area = l_width  * l_height / (l_viewBox_width * l_viewBox_height)

    if (p_area > l_area) { // Portrait Mode
        const pix_per_n = (width / p_viewBox_width)
        const dx = Math.max(0, (width - p_width) / pix_per_n)
        const dy = Math.max(0, (height - p_height) / pix_per_n)
        const portrait_viewBox_string = `${$portrait_viewBox_rect.getAttribute('x') - dx/2} ${+$portrait_viewBox_rect.getAttribute('y') - dy} ${p_viewBox_width + dx} ${p_viewBox_height + dy}`
        $game_svg.setAttribute('viewBox', portrait_viewBox_string)
        $game_svg.classList.remove('landscape')
        $game_svg.classList.add('portrait')
    } else { // Landscape Mode
        const pix_per_n = (width / l_viewBox_width)
        const dx = Math.max(0, (width - l_width) / pix_per_n)
        const dy = Math.max(0, (height - l_height) / pix_per_n)
        const landscape_viewBox_string = `${$landscape_viewBox_rect.getAttribute('x') -dx/2} ${+$landscape_viewBox_rect.getAttribute('y') - dy} ${l_viewBox_width + dx} ${l_viewBox_height + dy}`
        $game_svg.setAttribute('viewBox', landscape_viewBox_string)
        $game_svg.classList.add('landscape')
        $game_svg.classList.remove('portrait')
    }
    $game_svg.setAttribute('width', width)
    $game_svg.setAttribute('height', height)
}
window.addEventListener('resize', handleResize)
handleResize()


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
        ctx.fillStyle = 'black'
        ctx.beginPath();
        ctx.ellipse((box.x + box.center_x) * PIX_PER_BOX, (box.y + box.center_y) * PIX_PER_BOX, 5, 5, 0, 0, 2 * Math.PI)
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

    p_context_bg.then(ctx => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, GAME_WIDTH * PIX_PER_BOX, GAME_HEIGHT * PIX_PER_BOX)
    })

    const p_f_draw_fg = (async () => {
        const ctx = await p_context_fg
        return () => {
            if (!current_game) return
            ctx.clearRect(0, 0, GAME_WIDTH * PIX_PER_BOX, GAME_HEIGHT * PIX_PER_BOX)
            if (current_game.fallingBox) {
                drawBox(ctx, current_game.fallingBox, 'falling')
            }
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