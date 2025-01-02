document.getElementById('debug').addEventListener('click', function() {
    showPopup(`
        <h2>Debug Settings</h2>
        ${Object.keys(debug).map(key => `<p>${key}: <input type='checkbox' ${debug[key] ? 'checked=true' : ''} /></p>`).join('')}
    `, 
    'Save',
    function(popup) {
        let checkboxes = popup.getElementsByTagName('input');
        for (let i = 0; i < checkboxes.length; i++) {
            debug[checkboxes[i].previousSibling.textContent.split(":")[0]] = checkboxes[i].checked;
        }
    });
});

document.getElementById('how-to-play').addEventListener('click', function() {
    showPopup(`
        <h2>How to play</h2>
        <p>This game must be played on a phone or other device with motion sensors. Hold your phone in front of you, parallel to 
        the ground (the screen should be facing up, like you're about to take a photo of the ground with your back camera).
        When you move, the screen will turn blue for a bit. <b>Wait for the screen to turn pink again before making your 
        next movement, otherwise it will not register.</b> When you squat, the femboy on screen will follow you. If the femboy
        does not move, <b>you must make the downward or upward motion faster or more noticeable.</b> Due to limitations with
        making webgames, the game can only detect rapid downward/upwards movements, and cannot determine your actual position.
        The game works best when you squat as follows: quickly down, wait for screen to turn pink, quickly up, wait for screen to
        turn pink, repeat. Hope you enjoy :3.</p>
    `, 'Got it!');
});

document.getElementById('about').addEventListener('click', function() {
    showPopup(`
        <h2>About</h2>
        <p>I made this game to demonstrate the use of the DeviceMotionEvent interface in webgames. 
        It was very difficult to infer position from this event, since it only provides low-resolution accelerometer data.
        However, with enough calculus, it was possible to detect rapid movements in a particular direction.
        Still, this was only tested on iOS Safari, and I suspect cross-browser compatibility will be poor.
        The project is open-source on GitHub, so I welcome any contributions to improve motion detection or add new features.
        I'm sure there are enough femboy programmers to help out.</p>
        <p>- Lots of love, DinoFemboi.</p>
    `, 'Cool!');
});

document.getElementById('start').addEventListener('click', function() {
    initDeviceMotion();
});

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function splitRgb(color) {
    let [r, g, b] = color.replace('rgb(', '')
        .replace(')', '')
        .split(',')
        .map(str => Number(str));;
    return {
        r,
        g,
        b
    }
}

function joinRgb(color) {
    return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function colorInterpolate(colorA, colorB, intval) {
    const colorVal = (prop) =>
        Math.round(colorA[prop] * (1 - intval) + colorB[prop] * intval);
    return {
        r: colorVal('r'),
        g: colorVal('g'),
        b: colorVal('b'),
    }
}

const c = document.getElementById('c');
const ctx = c.getContext('2d');

function resizeCanvas() {
    c.width = window.innerWidth;
    c.height = window.innerHeight;
}

var sprites = {};
function loadSprite(name, src) {
    sprites[name] = new Image();
    sprites[name].src = src;
}
loadSprite('player', './sprites/player.png');

var fonts = {};
function loadFont(name, src) {
    fonts[name] = new FontFace(name, `url(${src})`);
    fonts[name].load().then(function(loadedFace) {
        document.fonts.add(loadedFace);
    });
}
loadFont('Sniglet Regular', './fonts/Sniglet-Regular.ttf');
loadFont('Sniglet Extra Bold', './fonts/Sniglet-ExtraBold.ttf');

function drawSprite(name, x, y, scale = 1) {
    ctx.drawImage(sprites[name], x - sprites[name].width * scale / 2, y - sprites[name].height * scale / 2, sprites[name].width * scale, sprites[name].height * scale);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function initDeviceMotion() {
    if (!DeviceMotionEvent || !DeviceOrientationEvent) {
        showPopup(`
            <h2>No motion support :(</h2>
            <p>Your browser is reporting it does not support motion detection. Check you have 
            allowed the page to access motion and orientation data and refresh, or try a different browser or device.</p>
        `,
        'Okie');
        return;
    }
    if (DeviceMotionEvent.requestPermission) {
        DeviceMotionEvent.requestPermission()
            .then(response => {
                if (response === 'granted') {
                    console.log('Permission granted');
                    start();
                    return;
                }
                if (response === 'denied') {
                    showPopup(`
                        <h2>Permission denied :(</h2>
                        <p>You have denied permission to access motion and orientation data. Check your browser settings and restart your browser.</p>
                    `,
                    'Okie');
                    console.log('Permission denied');
                    return;
                }
                showPopup(`
                    <h2>Permission error :(</h2>
                    <p>There was an error requesting permission to access motion and orientation data. Check your browser settings and restart your browser.</p>
                `,
                'Okie');
            });
        console.log('DeviceMotionEvent.requestPermission is supported');        
        return;
    }
    console.log('DeviceMotionEvent is supported');
    start();
}

function start() {
    document.getElementsByTagName('main')[0].style.display = 'none';
    document.getElementById('c').style.display = 'block';
    window.addEventListener('devicemotion', onDeviceMotion);
    window.addEventListener('deviceorientation', onDeviceOrientation);
    setInterval(function() {
        if (performance.now() - lastDeviceMotion > 3000) {
            if (!debug.ignoreNoMotionWarning && !document.getElementById('no-motion-warning')) {
                showPopup(`
                    <h2>Not detecting motion :(</h2>
                    <p>Your device is not reporting motion data. This often occurs when you use a device without a motion sensor
                    (e.g. laptop or pc). Try again on your phone. If you are sure your device has a motion sensor, check you have 
                    allowed the page to access motion and orientation data and refresh. You can disable this warning in debug 
                    settings by checking ignoreNoMotionWarning.</p>
                `,
                'Okie', null, 'no-motion-warning');
            }
        }
    }, 3000);
    requestAnimationFrame(render);
}

const debug = {
    motion: false,
    bounds: false,
    circle: false,
    text: false,
    ignoreNoMotionWarning: false
}

let position = 0;
let velocity = 0;

let lastVelocity = 0;
let lastAcceleration = 0;

let positionHistory = [0];
let velocityHistory = [];
let accelerationHistory = [];
let individualAccelerationHistory = {
    x: [],
    y: [],
    z: []
};

let ignoreAcceleration = 0;

let minPosition = 0;
let maxPosition = 0;
let lastRelativePosition = 0;

let count = 0;

let effects = [];

let lastDeviceMotion = 0;

//game
let shownState = -200;

function onDeviceMotion(e) {
    const acceleration = e.acceleration;
    let dt = e.interval*1000;
    lastDeviceMotion = performance.now();

    // acceleration
    // let verticalAcceleration = (acceleration.x * up.x + acceleration.y * up.y + acceleration.z * up.z);
    //select maximum magnitude of acceleration and preserve sign
    // let verticalAcceleration = Math.max(Math.abs(acceleration.x), Math.abs(acceleration.y), Math.abs(acceleration.z));

    let verticalAcceleration = acceleration.z;
    if (verticalAcceleration === Math.abs(acceleration.x)) {
        verticalAcceleration = acceleration.x;
    } else if (verticalAcceleration === Math.abs(acceleration.y)) {
        verticalAcceleration = acceleration.y;
    } else {
        verticalAcceleration = acceleration.z;
    }
    // let verticalAcceleration = acceleration.z;
    if (!lastAcceleration) lastAcceleration = verticalAcceleration;
    // apply deadzone
    if (Math.abs(verticalAcceleration) < 0.3) {
        verticalAcceleration = 0;
    }
    if (ignoreAcceleration <= 0) {
        velocity += (verticalAcceleration + lastAcceleration)/2 * dt / 1000;
    } else {
        if (Math.sign(verticalAcceleration) !== ignoreAcceleration) ignoreAcceleration--;
        verticalAcceleration = 0;
    }
    accelerationHistory.push(verticalAcceleration);

    //velocity
    velocity *= 0.9; //compensate for imprecision
    if (Math.abs(velocity) < 0.05) {
        velocity = 0;
    }
    //ignore deceleration input, instead decrease velocity manually
    if (Math.abs(velocity) > 0.3 && Math.sign(velocity) !== Math.sign(verticalAcceleration)) {
        ignoreAcceleration = 10;
    }
    if (!lastVelocity) lastVelocity = velocity;
    velocityHistory.push(velocity);

    //position
    position += (velocity + lastVelocity)/2 * dt / 2;
    positionHistory.push(position);

    //adjust min and max bounds
    if (!velocity) {
        let lastVelocitySign = 0;
        const minDistance = 100;
        for (let i = velocityHistory.length - 1; i >= 0; i--) {
            if (velocityHistory[i]) {
                lastVelocitySign = Math.sign(velocityHistory[i]);
                break;
            }
        }
        if (lastVelocitySign > 0) {
            if (Math.abs(position - minPosition) > minDistance) maxPosition = position;
        } else if (lastVelocitySign < 0) {
            if (Math.abs(position - maxPosition) > minDistance) minPosition = position;
        }
    }

    //count number of times the user moves the device up from below the middle position
    let relativePosition = Math.sign(position - (minPosition + maxPosition)/2);
    if (relativePosition !== lastRelativePosition) {
        if (relativePosition < 0) {
            squatComplete();
        }
    }

    if (lastRelativePosition < 0 && shownState > -200) {
        shownState -= 50;
    }
    if (lastRelativePosition > 0 && shownState < 200) {
        shownState += 50;
    }

    lastAcceleration = verticalAcceleration;
    lastVelocity = velocity;
    lastRelativePosition = Math.sign(position - (minPosition + maxPosition)/2);
}

function squatComplete() {
    count++;
    let message = count;
    let textColour;
    if (count % 5 === 0) {
        message = count + "!";
    }
    if (count % 10 === 0) {
        textColour = '#ed9b4d';
        addFirework(
            Math.random() * c.width,
            Math.random() * c.height,
            [
                'rgb(64, 224, 208)',
                'rgb(255, 140, 0)',
                'rgb(255, 0, 128)',
            ]
        );
    }
    if (count % 15 === 0) {
        addFirework(
            Math.random() * c.width,
            Math.random() * c.height,
            [
                'rgb(64, 224, 208)',
                'rgb(255, 140, 0)',
                'rgb(255, 0, 128)',
            ]
        );
    }
    if (count % 20 === 0) {
        addText(
            Math.random() * (c.width - 100) + 50,
            Math.random() * (c.height - 100) + 50,
            'uwu so strong',
            'rgb(255, 0, 128)'
        );
    }
    if (count % 25 === 0) {
        textColour = 'rgb(255, 0, 128)';
        addFirework(
            Math.random() * c.width,
            Math.random() * c.height,
            [
                'rgb(64, 224, 208)',
                'rgb(255, 140, 0)',
                'rgb(255, 0, 128)',
            ]
        );
    }
    if (count % 50 === 0) {
        message = count + '!!';
        textColour = 'gold';
        addFirework(
            Math.random() * c.width,
            Math.random() * c.height,
            [
                'rgb(64, 224, 208)',
                'rgb(255, 140, 0)',
                'rgb(255, 0, 128)',
            ]
        );
        addText(
            Math.random() * (c.width - 100) + 50,
            Math.random() * (c.height - 100) + 50,
            'WOAH',
            textColour
        );
    }
    if (count % 100 === 0) {
        message = count + '!!!';
        textColour = '#0ABAB5';
        addFirework(
            Math.random() * c.width,
            Math.random() * c.height,
            [
                'rgb(64, 224, 208)',
                'rgb(255, 140, 0)',
                'rgb(255, 0, 128)',
            ]
        );
        addText(
            Math.random() * (c.width - 100) + 50,
            Math.random() * (c.height - 100) + 50,
            'SQUAT MASTER',
            textColour
        );
    }
    if (count >=50) message += '!';
    if (count >=100) {
        message = "!!! " + message + " !!!";
        textColour = '#0ABAB5';
            addFirework(
                Math.random() * c.width,
                Math.random() * c.height,
                [
                    'rgb(64, 224, 208)',
                    'rgb(255, 140, 0)',
                    'rgb(255, 0, 128)',
                ]
            );
            addText(
                Math.random() * (c.width - 100) + 50,
                Math.random() * (c.height - 100) + 50,
                'You win! :33',
                textColour
            );
    }
    addText(
        Math.random() * (c.width - 100) + 50,
        Math.random() * (c.height - 100) + 50,
        message,
        textColour
    );
}

let lastRenderTime = 0;
function render(renderTime) {
    const dt = renderTime - lastRenderTime;
    lastRenderTime = renderTime;

    //clear screen
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#f5a9b8';
    if (ignoreAcceleration >0) ctx.fillStyle = '#5bcefa';
    ctx.fillRect(0, 0, c.width, c.height);

    drawSprite('player', c.width / 2, c.height / 2 + shownState);

    ctx.fillStyle = 'white';
    ctx.font = '40px Sniglet Regular';
    ctx.textAlign = 'center';
    ctx.fillText(count, c.width / 2, c.height - 50);

    //draw effects
    for (let i = effects.length - 1; i >= 0; i--) {
        let effect = effects[i];
        effect.time += dt;
        if (effect.time > effect.duration) {
            effects.splice(i, 1);
            continue;
        }
        effect.handler(effect);
    }

    if (debug.motion || debug.bounds || debug.circle || debug.text) drawDebug();

    requestAnimationFrame(render);
}

function drawSparkle(e) {
    ctx.fillStyle = e.meta.color;
    ctx.globalAlpha = 1 - e.time / e.duration;
    ctx.beginPath();
    ctx.arc(e.meta.x, e.meta.y, e.meta.radius, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawFirework(e) {
    for (let i=0; i<e.meta.particles.length; i++) {
        let particle = e.meta.particles[i];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.04;
        particle.vx *= 0.99;
        particle.vy *= 0.99;
        particle.trail.push({x: particle.x, y: particle.y});
        if (particle.trail.length > 100) particle.trail.shift();
        particle.trail.forEach(function(trail, index) {
            ctx.globalAlpha = index / particle.trail.length;
            let gradientProgress = index / particle.trail.length * e.meta.colorGradient.length;
            let adjacentColours = [
                splitRgb(e.meta.colorGradient[Math.floor(gradientProgress)]),
                splitRgb(e.meta.colorGradient[Math.floor(gradientProgress)+1] || e.meta.colorGradient[e.meta.colorGradient.length - 1])
            ];
            ctx.fillStyle = joinRgb(colorInterpolate(adjacentColours[0], adjacentColours[1], gradientProgress % 1));
            if (e.time > e.duration - 500) ctx.globalAlpha *= 1 - (e.time - e.duration + 500) / 500;
            ctx.beginPath();
            ctx.arc(trail.x, trail.y, e.meta.radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        if (Math.random() > 0.95) {
            effects.push({
                time: 0,
                duration: 1000,
                handler: drawSparkle,
                meta: {
                    x: particle.x + Math.sign(Math.random()-0.5) * (Math.random() * e.meta.radius*1.5 + e.meta.radius),
                    y: particle.y + Math.sign(Math.random()-0.5) * (Math.random() * e.meta.radius*1.5 + e.meta.radius),
                    radius: e.meta.radius - 1,
                    color: e.meta.colorGradient[e.meta.colorGradient.length - 1]
                }
            });
        }
    }
}

function drawText(e) {
    e.meta.rotation += e.meta.vr;
    if (Math.abs(e.meta.rotation) > Math.PI/50) e.meta.vr *= -1;
    e.meta.x += e.meta.vx;
    ctx.save();
    ctx.translate(e.meta.x, e.meta.y);
    ctx.rotate(e.meta.rotation);
    ctx.fillStyle = e.meta.colour;
    ctx.font = '40px Sniglet Regular';
    ctx.textAlign = 'center';
    ctx.fillText(e.meta.text, 0, 0);
    ctx.restore();
}

function addFirework(x, y, colorGradient, radius = 4, particleNumber = 40, entropy = 2) {
    let firework = {
        time: 0,
        duration: 3500,
        handler: drawFirework,
        meta: {
            particles: [],
            colorGradient: colorGradient,
            radius: radius
        },
    }
    for (let i=0; i<particleNumber; i++) {
        firework.meta.particles.push({
            x: x,
            y: y,
            vx: 6*Math.cos(2*Math.PI*i/particleNumber)+ Math.random()*entropy-entropy/2,
            vy: 6*Math.sin(2*Math.PI*i/particleNumber)-4 + Math.random()*entropy-entropy/2,
            trail: []
        })
    }
    effects.push(firework);
}

function addText(x, y, text, colour = 'white') {
    effects.push({
        time: 0,
        duration: 3000,
        handler: drawText,
        meta: {
            x: x,
            y: y,
            rotation: 0,
            vr: 0.005,
            vx: Math.sign(Math.random()-0.5)*0.5,
            basex: x,
            text: text,
            colour: colour
        }
    });
}

let up = {
    x: 0,
    y: 0,
    z: 1
};
function onDeviceOrientation(e) {
    //calculate up vector
    const alpha = e.alpha * Math.PI / 180;
    const beta = e.beta * Math.PI / 180;
    const gamma = e.gamma * Math.PI / 180;
    up = {
        x: Math.cos(alpha) * Math.sin(beta),
        y: Math.sin(alpha) * Math.sin(beta),
        z: Math.cos(beta)
    };
}

function showPopup(content, closeCta = 'Close', closeHandler, id) {
    let popup = document.createElement('div');
    popup.classList.add('popup');
    popup.innerHTML = content;
    if (id) popup.id = id;
    let closeBtn = document.createElement('button');
    closeBtn.innerText = closeCta;
    closeBtn.addEventListener('click', function() {
        if (closeHandler) closeHandler(popup);
        document.body.removeChild(popup);
        if (document.getElementsByClassName('popup').length === 0) unblurBackground();
    });
    popup.appendChild(closeBtn);
    document.body.appendChild(popup);
    blurBackground();
}

const blurElm = document.getElementById('blur');

function blurBackground() {
    blurElm.style.display = 'block';
    blurElm.style.pointerEvents = 'auto';
    blurElm.style.opacity = 1;
}

function unblurBackground() {
    blurElm.style.opacity = 0;
    setTimeout(function() {
        blurElm.style.pointerEvents = 'none';
        blurElm.style.display = 'none';
    }, 600);
}