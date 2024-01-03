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

let current_game = null;

const [p_renderer, resolve_renderer] = (() => {
    let resolver;
    let p = new Promise((resolve) => {
        resolver = resolve;
    })
    return [p, resolver];
})();

function setup() {
const $game_object = document.getElementById('game');
const $game_svg = $game_object.contentDocument.querySelector('svg');
const $$viewBoxes = $game_svg.querySelectorAll('.viewBoxRect')
let $currentViewBox = null;
function handleResize() {
    const width = $game_svg.clientWidth;
    const height = $game_svg.clientHeight;
    let maxArea = 0;
    let $maxViewBox = null;
    let max_width = null;
    let max_height = null;
    for (const $viewBox of $$viewBoxes) {
        const viewBox_height = +$viewBox.getAttribute('height')
        const viewBox_width = +$viewBox.getAttribute('width')
        const aspect = viewBox_width / viewBox_height
    
        const actual_height =  Math.min(height, width / aspect)
        const actual_width =  actual_height * aspect
        const area = actual_width * actual_height / (viewBox_width * viewBox_height)
        if (area > maxArea) {
            maxArea = area;
            $maxViewBox = $viewBox;
            max_width = actual_width;
            max_height = actual_height;
        }
    }
    const viewBox_width = +$maxViewBox.getAttribute('width')
    const viewBox_height = +$maxViewBox.getAttribute('height')
    const pix_per_n = (width / viewBox_width)
    const dx = Math.max(0, (width - max_width) / pix_per_n)
    const dy = Math.max(0, (height - max_height) / pix_per_n)
    const portrait_viewBox_string = `${$maxViewBox.getAttribute('x') - dx/2} ${+$maxViewBox.getAttribute('y') - dy} ${viewBox_width + dx} ${viewBox_height + dy}`
    $game_svg.setAttribute('viewBox', portrait_viewBox_string)
    if ($currentViewBox !== $maxViewBox) {
        $currentViewBox = $maxViewBox
        $game_svg.querySelectorAll(`.viewBoxDependent:not(.${$maxViewBox.dataset.viewBoxClass})`).forEach(($el) => {
            $el.style.display = 'none';
        })
        $game_svg.querySelectorAll(`.viewBoxDependent.${$maxViewBox.dataset.viewBoxClass}`).forEach(($el) => {
            $el.style.display = 'inline';
        })
    }
    $game_svg.setAttribute('width', width)
    $game_svg.setAttribute('height', height)
}
window.addEventListener('resize', handleResize)
handleResize()



function left() {
    if (!current_game) return;
    current_game.move(-1);
    current_game.renderer.render(current_game)
}

function right() {
    if (!current_game) return;
    current_game.move(1);
    current_game.renderer.render(current_game)
}

function down() {
    if (!current_game) return;
    current_game.moveDown();
    current_game.renderer.render(current_game)
}

function repeatEvent($element, downevent, upevent, handler, filter) {
    let interval = null;
    function downhandler(ev) {
        if (interval !== null || (filter && !filter(ev))) return;
        handler()
        interval = setInterval(handler, 100)
        ev.preventDefault()
    }
    function uphandler(ev) {
        if (interval === null || (filter && !filter(ev))) return;
        clearInterval(interval)
        interval = null;
        ev.preventDefault()
    }
    for(const e of downevent.split(" ")) {
        $element.addEventListener(e, downhandler, {passive: false})
    }
    for(const e of upevent.split(" ")) {
        $element.addEventListener(e, uphandler, {passive: false})
    }
}

repeatEvent(document, 'keydown', 'keyup', left, (ev) => ev.code === "ArrowLeft")
repeatEvent(document, 'keydown', 'keyup', right, (ev) => ev.code === "ArrowRight")
repeatEvent(document, 'keydown', 'keyup', down, (ev) => ev.code === "ArrowDown")
repeatEvent($game_svg, 'keydown', 'keyup', left, (ev) => ev.code === "ArrowLeft")
repeatEvent($game_svg, 'keydown', 'keyup', right, (ev) => ev.code === "ArrowRight")
repeatEvent($game_svg, 'keydown', 'keyup', down, (ev) => ev.code === "ArrowDown")

repeatEvent($game_svg.getElementById('arrow_left_area'), 'mousedown touchstart', 'mouseup mouseleave touchend touchcancel', left)
repeatEvent($game_svg.getElementById('arrow_right_area'), 'mousedown touchstart', 'mouseup mouseleave touchend touchcancel', right)
repeatEvent($game_svg.getElementById('arrow_down_area'), 'mousedown touchstart', 'mouseup mouseleave touchend touchcancel', down)
const $board = $game_svg.getElementById('board')



$upcomingBox = $game_svg.getElementById('nextBox')

class SVGRenderer {

    constructor() {
        this.lastFalling = null;
        this.upcomingSize = null;
    }

    newGame() {
        for(const el of $board.querySelectorAll('.animatedbox')) {
            el.remove();
        }
    }

    drawBox(box) {
        if (!box.domEl) {
            console.log("Creating box for", box)
            box.domEl = document.createElementNS('http://www.w3.org/2000/svg', 'use')
            box.domEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#box_size_${box.size}`)
            box.domEl.classList.add('animatedbox')
            console.log("Creating box for", box.domEl)
            $board.appendChild(box.domEl)
        }
        box.domEl.setAttribute('transform', `translate(${box.x}, ${box.y}) scale(${box.width / box.size}, ${box.height / box.size})`)
    }
    render(game) {
        if (this.lastFalling && (this.lastFalling.state == BoxState.TO_BE_REMOVED || this.lastFalling.state == BoxState.REMOVED)) {
            if (this.lastFalling.domEl) {
                this.lastFalling.domEl.remove()
            }
        }
        if (game.fallingBox) {
            this.lastFalling = game.fallingBox
            this.drawBox(game.fallingBox)
        }
        for (const box of game.fixedBoxes) {
            if (box.state == BoxState.TO_BE_REMOVED) {
                if (box.domEl) {
                    box.domEl.remove()
                }
                continue
            }
            this.drawBox(box)
        }
        for (const box of game.growingBoxes) {
            if (box.state == BoxState.TO_BE_REMOVED) {
                if (box.domEl) {
                    box.domEl.remove()
                }
                continue
            }
            this.drawBox(box)
        }
        if (this.upcomingSize === null || this.upcomingSize !== game.upcomingSize) {
            this.upcomingSize = game.upcomingSize
            $upcomingBox.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#box_size_${this.upcomingSize}`)
            $upcomingBox.setAttribute('transform', `translate(${-this.upcomingSize + 1}, ${-this.upcomingSize + 1})`)
        }
    }
    gameOver() {
        $pauserestartbuttontext.textContent = 'RESTART';
    }
}

const $pauserestartbutton = $game_svg.getElementById('pauserestartbutton');
const $pauserestartbuttontext = $pauserestartbutton.querySelector('text')
async function start() {
    const renderer = await p_renderer
    renderer.newGame()
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT, renderer)
    current_game.start()
    $pauserestartbuttontext.textContent = 'PAUSE';
}

const $startbutton = $game_svg.getElementById('startbutton')
$startbutton.addEventListener('click', () => {
    $startbutton.style.display = 'none';
    start()
})

$pauserestartbutton.addEventListener('click', () => {
    if (!current_game) return;
    if (current_game.over) {
        start()
    }
    else if (current_game.paused) {
        current_game.start()
        $pauserestartbuttontext.textContent = 'PAUSE';
        $board.style.filter = ''
    } else if (!current_game.paused) {
        $board.style.filter = 'url(#filter_blur)'
        current_game.pause()
        $pauserestartbuttontext.textContent = 'UNPAUSE';
    }
})

resolve_renderer(new SVGRenderer())
}
