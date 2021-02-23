import { Vector } from "./vector";

export class Vertex {
    constructor() {
        this.coord = new Vector();
        this.texel = new Vector();
    }

    copy(other) {
        this.coord.copy(other.coord);
        this.texel.copy(other.texel);
        return this;
    }
}
