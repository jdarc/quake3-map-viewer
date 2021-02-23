export class Gradients {

    constructor() {
        this.dZdX = 0.0;
        this.dZdY = 0.0;
        this.dTudX = 0.0;
        this.dTudY = 0.0;
        this.dTvdX = 0.0;
        this.dTvdY = 0.0;
        this.dLudX = 0.0;
        this.dLudY = 0.0;
        this.dLvdX = 0.0;
        this.dLvdY = 0.0;
        this.oneOverZ0 = 0.0;
        this.oneOverZ1 = 0.0;
        this.oneOverZ2 = 0.0;
        this.dOneOverZdX = 0.0;
        this.dOneOverZdY = 0.0;
    }

    configure(rv0, rv1, rv2) {
        this.oneOverZ0 = 1.0 / rv0.coord.w;
        this.oneOverZ1 = 1.0 / rv1.coord.w;
        this.oneOverZ2 = 1.0 / rv2.coord.w;

        const v0X2X = rv0.coord.x - rv2.coord.x;
        const v1X2X = rv1.coord.x - rv2.coord.x;
        const v0Y2Y = rv0.coord.y - rv2.coord.y;
        const v1Y2Y = rv1.coord.y - rv2.coord.y;

        const oneOverDX = 1.0 / (v1X2X * v0Y2Y - v0X2X * v1Y2Y);
        const oneOverDY = -oneOverDX;
        const tx0 = oneOverDX * v0Y2Y;
        const tx1 = oneOverDX * v1Y2Y;
        const ty0 = oneOverDY * v0X2X;
        const ty1 = oneOverDY * v1X2X;

        const overZ20 = rv2.texel.x * this.oneOverZ2;
        const overZ21 = rv2.texel.y * this.oneOverZ2;
        const overZ22 = rv2.texel.z * this.oneOverZ2;
        const overZ23 = rv2.texel.w * this.oneOverZ2;

        let temp1 = this.oneOverZ1 - this.oneOverZ2;
        let temp2 = this.oneOverZ0 - this.oneOverZ2;
        this.dOneOverZdX = oneOverDX * (temp1 * v0Y2Y - temp2 * v1Y2Y);
        this.dOneOverZdY = oneOverDY * (temp1 * v0X2X - temp2 * v1X2X);

        temp1 = rv1.coord.z - rv2.coord.z;
        temp2 = rv0.coord.z - rv2.coord.z;

        this.dZdX = oneOverDX * (temp1 * v0Y2Y - temp2 * v1Y2Y);
        this.dZdY = oneOverDY * (temp1 * v0X2X - temp2 * v1X2X);

        let overZ00 = rv0.texel.x * this.oneOverZ0;
        let overZ01 = rv0.texel.y * this.oneOverZ0;
        let overZ02 = rv0.texel.z * this.oneOverZ0;
        let overZ03 = rv0.texel.w * this.oneOverZ0;
        let overZ10 = rv1.texel.x * this.oneOverZ1;
        let overZ11 = rv1.texel.y * this.oneOverZ1;
        let overZ12 = rv1.texel.z * this.oneOverZ1;
        let overZ13 = rv1.texel.w * this.oneOverZ1;
        overZ00 -= overZ20;
        overZ10 -= overZ20;
        overZ01 -= overZ21;
        overZ11 -= overZ21;
        overZ02 -= overZ22;
        overZ12 -= overZ22;
        overZ03 -= overZ23;
        overZ13 -= overZ23;
        this.dTudX = overZ10 * tx0 - overZ00 * tx1;
        this.dTudY = overZ10 * ty0 - overZ00 * ty1;
        this.dTvdX = overZ11 * tx0 - overZ01 * tx1;
        this.dTvdY = overZ11 * ty0 - overZ01 * ty1;
        this.dLudX = overZ12 * tx0 - overZ02 * tx1;
        this.dLudY = overZ12 * ty0 - overZ02 * ty1;
        this.dLvdX = overZ13 * tx0 - overZ03 * tx1;
        this.dLvdY = overZ13 * ty0 - overZ03 * ty1;
    }
}
