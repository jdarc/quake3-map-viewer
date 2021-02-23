export class Edge {

    constructor() {
        this.y = 0;
        this.height = 0;

        this.x = 0.0;
        this.xStep = 0.0;

        this.oneOverZ = 0.0;
        this.oneOverZStep = 0.0;

        this.z = 0.0;
        this.zStep = 0.0;

        this.tu = 0.0;
        this.tuStep = 0.0;

        this.tv = 0.0;
        this.tvStep = 0.0;

        this.lu = 0.0;
        this.luStep = 0.0;

        this.lv = 0.0;
        this.lvStep = 0.0;
    }

    configure(gradients, va, vb, zs) {
        this.y = Math.ceil(va.coord.y);
        this.height = Math.ceil(vb.coord.y) - this.y;

        if (this.height > 0) {
            const yPreStep = this.y - va.coord.y;
            this.xStep = (vb.coord.x - va.coord.x) / (vb.coord.y - va.coord.y);
            this.x = this.xStep * yPreStep + va.coord.x;
            const xPreStep = this.x - va.coord.x;
            const w = 1.0 / va.coord.w;

            this.z = yPreStep * gradients.dZdY + xPreStep * gradients.dZdX + va.coord.z;
            this.zStep = this.xStep * gradients.dZdX + gradients.dZdY;

            this.tu = yPreStep * gradients.dTudY + xPreStep * gradients.dTudX + w * va.texel.x;
            this.tuStep = this.xStep * gradients.dTudX + gradients.dTudY;

            this.tv = yPreStep * gradients.dTvdY + xPreStep * gradients.dTvdX + w * va.texel.y;
            this.tvStep = this.xStep * gradients.dTvdX + gradients.dTvdY;

            this.lu = yPreStep * gradients.dLudY + xPreStep * gradients.dLudX + w * va.texel.z;
            this.luStep = this.xStep * gradients.dLudX + gradients.dLudY;

            this.lv = yPreStep * gradients.dLvdY + xPreStep * gradients.dLvdX + w * va.texel.w;
            this.lvStep = this.xStep * gradients.dLvdX + gradients.dLvdY;

            this.oneOverZ = yPreStep * gradients.dOneOverZdY + xPreStep * gradients.dOneOverZdX + zs;
            this.oneOverZStep = this.xStep * gradients.dOneOverZdX + gradients.dOneOverZdY;
        }
    }
}
