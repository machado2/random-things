const angsize = Math.PI;

let ctx;
let canvas;

function changeAngle(previous) {
    return previous + Math.random() * angsize - angsize / 2;
}

function randomColor() {
    return '#' + Math.floor(0x800000 + Math.random() * 0x7fffff).toString(16);
}

function tree(previousAngle, x, y, level) {
    const len = canvas.height * 0.5 / Math.pow(1.8, level);
    const angle = changeAngle(previousAngle);
    const newx = x + Math.cos(angle) * len;
    const newy = y + Math.sin(angle) * len;
    ctx.strokeStyle = randomColor();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(newx, newy);
    ctx.closePath();
    ctx.stroke();
    if (level < 5) {
        for (let i = 0; i < 7; i++) {
            tree(angle, newx, newy, level + 1);
        }
    }
}

function readBackground() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const background = [];
    for (let p = 0; p < imageData.length; p += 4) {
        background.push(imageData[p] != 0 || imageData[p + 1] != 0 || imageData[p + 2] != 0);
    }
    return background;
}

function snow() {
    const particles = [];

    setInterval(() => {

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixelPos = (x, y) => y * canvas.width * 4 + x * 4;
        const getPixel = (x, y) => {
            const pos = pixelPos(x, y) + 3;
            return imageData.data[pos] != 0;
        }
        const putPixel = (x, y, c) => {
            const pos = pixelPos(x, y);
            imageData.data[pos] = (c & 0xFF0000) >> 16;
            imageData.data[pos + 1] = (c & 0xFF00) >> 8;
            imageData.data[pos + 2] = c & 0xFF;
            imageData.data[pos + 3] = c == 0 ? 0 : 0xFF;
        };


        if (particles.length < 1000) {
            particles.push({
                x: Math.floor(Math.random() * canvas.width),
                y: 0,
                color: Math.floor(Math.random() * 0xFFFFFF)
            });
        }
        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];

            const ox = p.x;
            const oy = p.y;

            const die = () => particles.splice(i, 1);

            if (p.y >= (canvas.height - 1)) {
                die();
            } else if (!getPixel(p.x, p.y + 1)) {
                p.y++;
            } else {
                const totest =
                    Math.random() > 0.5
                        ? [p.x - 1, p.x + 1]
                        : [p.x + 1, p.x - 1];
                if (!getPixel(totest[0], p.y + 1)) {
                    p.y++;
                    p.x = totest[0];
                } else if (!getPixel(totest[1], p.y + 1)) {
                    p.y++;
                    p.x = totest[1];
                } else {
                    die(p);
                }
            }

            putPixel(ox, oy, 0);
            putPixel(p.x, p.y, p.color);
        }
        ctx.putImageData(imageData, 0, 0);
    }, 0);

}

export function drawtree(canvasElement, context) {
    canvas = canvasElement;
    ctx = context;
    const rangex = canvas.width * 0.2;
    const x = (canvas.width - rangex) / 2 + Math.random() * rangex;
    const y = canvas.height - Math.random() * canvas.height * 0.3;
    const angle = -Math.PI / 2;
    tree(angle, x, y, 1);
}
