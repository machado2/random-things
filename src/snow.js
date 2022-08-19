const particles = [];

export function snowtick(canvas, ctx) {
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
}

export function snow(canvas, ctx) {
    const timer = setInterval(() => {
        if (!canvas.isConnected) {
            clearInterval(timer);
        } else {
            snowtick(canvas, ctx);
        }
    }, 0);
}
