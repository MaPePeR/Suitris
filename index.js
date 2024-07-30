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
    if (navigator.userAgent.toLowerCase().includes('firefox')) {
        //Firefox doesn't work because of https://bugzilla.mozilla.org/show_bug.cgi?id=265895
        const date1 = new Date();
        const date2 = new Date(2004, 10, 24);
        //https://stackoverflow.com/a/62922738/2256700
        let years = new Date(date1).getFullYear() - new Date(date2).getFullYear();
        let month = new Date(date1).getMonth() - new Date(date2).getMonth();
        let dateDiff = new Date(date1).getDay() - new Date(date2).getDay();
        if (dateDiff < 0) {
            month -= 1;
        }
        if (month < 0) {
            years -= 1;
        }
        console.log(years)
        alert(`Because of a ${years} year old Firefox bug, that was marked as WONTFIX, this game sadly does not work in Firefox at the moment.`);
    }
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


$game_svg.addEventListener('touchmove', (ev) => {
    ev.preventDefault();
})

$upcomingBox = $game_svg.getElementById('nextBox')
const $highscore_text = $game_svg.getElementById('highscoretext')

class SVGRenderer {

    constructor() {
        this.lastFalling = null;
        this.upcomingSize = null;
        this.updateHighScore(0)
        this.boxesToRemove = [];
    }

    newGame() {
        for(const el of $board.querySelectorAll('.animatedbox')) {
            el.remove();
        }
        this.boxesToRemove.length = 0;
    }

    drawBox(box) {
        if (!box.domEl) {
            console.log("Creating box for", box)
            box.domEl = document.createElementNS('http://www.w3.org/2000/svg', 'use')
            box.domEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#box_size_${box.size}`)
            box.domEl.classList.add('animatedbox')
            box.domEl.setAttribute('transform', `translate(${box.x + box.width / 2}, ${GAME_HEIGHT - box.height - (box.y + box.height / 2)}) scale(0)`)
            console.log("Creating box for", box.domEl)
            $board.appendChild(box.domEl)
            setTimeout(this.drawBox.bind(this, box))
        } else {
            box.domEl.setAttribute('transform', `translate(${box.x}, ${GAME_HEIGHT - box.height - box.y}) scale(${box.width / box.size}, ${box.height / box.size})`)
        }
    }
    render(game) {
        function setRemoveHandlers(domEl) {
            domEl.addEventListener('transitionend', function(ev) {
                ev.target.remove()
            })
            const elRef = new WeakRef(domEl);
            setTimeout(function() {
                const el = elRef.deref();
                if (el) {
                    el.remove();
                }
            }, 256);
        }
        for (const box of this.boxesToRemove) {
            setRemoveHandlers(box.domEl);
            box.domEl.setAttribute('transform', `translate(${box.x + box.width / 2}, ${GAME_HEIGHT - (box.y + box.height / 2)}) scale(0)`)
        }
        this.boxesToRemove.length = 0
        if (game.fallingBox) {
            this.lastFalling = game.fallingBox
            this.drawBox(game.fallingBox)
        }
        for (const box of game.fixedBoxes) {
            if (box.state == BoxState.TO_BE_REMOVED) {
                if (box.domEl) {
                    this.boxesToRemove.push(box)
                }
            }
            this.drawBox(box)
        }
        for (const box of game.growingBoxes) {
            if (box.state == BoxState.TO_BE_REMOVED) {
                if (box.domEl) {
                    this.boxesToRemove.push(box)
                }
            }
            this.drawBox(box)
        }
        if (this.upcomingSize === null || this.upcomingSize !== game.upcomingSize) {
            this.upcomingSize = game.upcomingSize
            $upcomingBox.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', `#box_size_${this.upcomingSize}`)
            $upcomingBox.setAttribute('transform', `translate(${-this.upcomingSize + 1}, ${-this.upcomingSize + 1})`)
        }
    }
    updateScore(score) {
        $scoretext.textContent = score.toFixed(0)
    }
    gameOver(finalScore) {
        $pauserestartbuttontext.textContent = 'RESTART';
        this.updateHighScore(finalScore);
        if (current_game) {
            saveGame(current_game)
        }
    }

    updateHighScore(score) {
        const current_highscore = localStorage.getItem('suitris_highscore')
        if (current_highscore === null || +current_highscore < score) {
            localStorage.setItem('suitris_highscore', score.toFixed(0));
        }
        $highscore_text.textContent = localStorage.getItem('suitris_highscore');
    }
}

const $scoretext = $game_svg.getElementById('scoretext')

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
        saveGame(current_game);
    }
})

if ("hidden" in document) {
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            if (!current_game) return;
            if (current_game.paused || !current_game.running || current_game.over) return;
            $board.style.filter = 'url(#filter_blur)'
            current_game.pause()
            $pauserestartbuttontext.textContent = 'UNPAUSE';
            saveGame(current_game);
        }
    });
}

document.addEventListener("beforeunload", function(ev) {
    if (!current_game) return;
    saveGame(current_game);
})

const loadedGame = loadGame();
if (loadedGame) {
    $startbutton.style.display = 'none';
    
    loadedGame.paused = true;
    loadedGame.running = false;
    (async () => {
        const renderer = await p_renderer;
        loadedGame.renderer = renderer;
        renderer.render(loadedGame);
        renderer.updateScore(loadedGame.score);
        if (loadedGame.over) {
            renderer.gameOver(loadedGame.score);
            loadedGame.fallingBox = null;
        } else {
            $board.style.filter = 'url(#filter_blur)'
            loadedGame.pause()
            $pauserestartbuttontext.textContent = 'UNPAUSE';
        }
        current_game = loadedGame;
    })();
}

resolve_renderer(new SVGRenderer())
}

function bufferToB64(buffer) {
    return btoa(Array.from(new Uint8Array(buffer)).map(b => String.fromCharCode(b)).join(''));
}
function B64ToBuffer(b64) {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0)).buffer;
}
function saveGame(game) {
    const buffer = game.serialize();
    localStorage.setItem('saved_game', bufferToB64(buffer));
}

function loadGame() {
    const buffer = localStorage.getItem('saved_game');
    if (!buffer) return null;
    try {
        return createGameStateFromBuffer(B64ToBuffer(buffer));
    } catch (e) {
        console.log("Loading game state failed", e);
    }
    return null;
}