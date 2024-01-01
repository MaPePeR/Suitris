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
function setup() {
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



let current_game = null;

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
        if (interval || (filter && !filter(ev))) return;
        handler()
        interval = setInterval(handler, 50)
    }
    function uphandler(ev) {
        if (!interval || (filter && !filter(ev))) return;
        clearInterval(interval)
        interval = null;
    }
    for(const e of downevent.split(" ")) {
        $element.addEventListener(e, downhandler, {passive: true})
    }
    for(const e of upevent.split(" ")) {
        $element.addEventListener(e, uphandler, {passive: true})
    }
}

repeatEvent(document, 'keydown', 'keyup', left, (ev) => ev.code === "ArrowLeft")
repeatEvent(document, 'keydown', 'keyup', right, (ev) => ev.code === "ArrowRight")
repeatEvent(document, 'keydown', 'keyup', down, (ev) => ev.code === "ArrowDown")
repeatEvent($game_svg, 'keydown', 'keyup', left, (ev) => ev.code === "ArrowLeft")
repeatEvent($game_svg, 'keydown', 'keyup', right, (ev) => ev.code === "ArrowRight")
repeatEvent($game_svg, 'keydown', 'keyup', down, (ev) => ev.code === "ArrowDown")

repeatEvent($game_svg.getElementById('arrow_left_area'), 'mousedown touchstart', 'mouseup mouseleave touchend', left)
repeatEvent($game_svg.getElementById('arrow_right_area'), 'mousedown touchstart', 'mouseup mouseleave touchend', right)
repeatEvent($game_svg.getElementById('arrow_down_area'), 'mousedown touchstart', 'mouseup mouseleave touchend', down)
const $board = $game_svg.getElementById('board')



$upcomingBox = $game_svg.getElementById('nextBox')

class SVGRenderer {

    constructor() {
        this.lastFalling = null;
        this.upcomingSize = null;
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
        $startbutton.style.display = 'inline';
    }
}

function start() {
    if (current_game) {
        for(const el of $board.querySelectorAll('.animatedbox')) {
            el.remove();
        }
    }
    current_game = new GameState(GAME_WIDTH, GAME_HEIGHT, new SVGRenderer())
    current_game.start()
}

const $startbutton = $game_svg.getElementById('startbutton')
$startbutton.addEventListener('click', () => {
    $startbutton.style.display = 'none';
    start()
})

}
