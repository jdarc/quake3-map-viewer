export class Surface {
    constructor(canvas) {
        this.width = canvas.width;
        this.height = canvas.height;
        this.context = canvas.getContext("2d");
        this.imageData = this.context.createImageData(this.width, this.height);
        this.data = this.imageData.data;
        this.data.fill(255);
    }

    update() {
        return this.context.putImageData(this.imageData, 0, 0);
    }

    drawString(message) {
        this.context.fillStyle = "orange";
        this.context.font = "bold 16px Arial";
        const metrics = this.context.measureText(message);
        this.context.fillText(message, (this.width - metrics.width) / 2.0, (this.height - 16) / 2.0);
    }
}
