function drawDebug() {
    //DEBUG
    //draw circle
    if (debug.circle) {
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(c.width / 2, c.height/2 + position, 10, 0, 2 * Math.PI);
        ctx.closePath();
        ctx.fill();
    }

    //debug text
    if (debug.text) {
        ctx.fillStyle = 'white';
        ctx.font = '14px Sniglet Regular';
        ctx.textAlign = 'left';
        ctx.fillText(`position: ${(c.height/2 + position).toFixed(2)}`, 10, 20);
        ctx.fillText(`velocity: ${velocity.toFixed(2)}`, 10, 40);
        ctx.fillText(`acceleration: ${lastAcceleration.toFixed(2)}`, 10, 60);
        ctx.fillText(`up vector (device rotation): ${up.x.toFixed(2)}, ${up.y.toFixed(2)}, ${up.z.toFixed(2)}`, 10, 80);
        ctx.fillText(`min position (real world max height): ${minPosition.toFixed(2)}`, 10, 100);
        ctx.fillText(`max position (real world min height): ${maxPosition.toFixed(2)}`, 10, 120);
        ctx.fillText(`ignore acceleration: ${ignoreAcceleration > 0 ? "yes (for " + ignoreAcceleration + "ms)" : "no"}`, 10, 140);
        ctx.fillText(`last relative position: ${lastRelativePosition > 0 ? "down" : "up"} (${lastRelativePosition})`, 10, 160);
        ctx.fillText(`count: ${count}`, 10, 180);
    }

    if (debug.motion) {
        // acceleration = green
        // velocity = blue
        // position = white
        // min and max position = yellow
        // middle position = purple
        // baseline = white
        // screen flashes orange when acceleration is ignored

        //draw baseline
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, c.height / 2);
        ctx.lineTo(c.width, c.height / 2);
        ctx.closePath();
        ctx.stroke();

        //graph acceleration history
        ctx.strokeStyle = 'green';
        ctx.beginPath();
        ctx.moveTo(0, c.height / 2);
        for (let i = 0; i < accelerationHistory.length; i++) {
            ctx.lineTo(i, c.height / 2 + accelerationHistory[i]*10);
        }
        ctx.stroke();
        if (accelerationHistory.length > c.width) {
            accelerationHistory.shift();
        }

        //graph velocity history
        ctx.strokeStyle = 'blue';
        ctx.beginPath();
        ctx.moveTo(0, c.height / 2);
        for (let i = 0; i < velocityHistory.length; i++) {
            ctx.lineTo(i, c.height / 2 + velocityHistory[i]*100);
        }
        ctx.stroke();
        if (velocityHistory.length > c.width) {
            velocityHistory.shift();
        }
        
        //graph screen position history
        ctx.strokeStyle = 'white';
        ctx.beginPath();
        ctx.moveTo(0, c.height / 2);
        for (let i = 0; i < positionHistory.length; i++) {
            ctx.lineTo(i, c.height / 2 + positionHistory[i]);
        }
        ctx.stroke();
        if (positionHistory.length > c.width) {
            positionHistory.shift();
        }
    }

    if (debug.bounds) {
        //draw min and max position
        ctx.strokeStyle = 'yellow';
        ctx.beginPath();
        ctx.moveTo(0, c.height / 2 + minPosition);
        ctx.lineTo(c.width, c.height / 2 + minPosition);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, c.height / 2 + maxPosition);
        ctx.lineTo(c.width, c.height / 2 + maxPosition);
        ctx.closePath();
        ctx.stroke();

        //draw middle position
        ctx.strokeStyle = 'purple';
        ctx.beginPath();
        ctx.moveTo(0, c.height / 2 + (minPosition + maxPosition)/2);
        ctx.lineTo(c.width, c.height / 2 + (minPosition + maxPosition)/2);
        ctx.closePath();
        ctx.stroke();
    }
}