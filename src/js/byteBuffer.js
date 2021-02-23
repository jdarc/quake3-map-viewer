export class ByteBuffer {

    constructor(data) {
        this.index = 0;
        this.buffer = data;
    }

    pos(n) {
        this.index = n;
        return this;
    };

    skip(num) {
        this.index += num;
        return this;
    };

    readByte() {
        return this.buffer[this.index++];
    }

    readInt() {
        return this.readByte() | this.readByte() << 0x08 | this.readByte() << 0x10 | this.readByte() << 0x18;
    }

    readFloat() {
        const bits = this.readInt();
        const s = (bits & 0x80000000) !== 0 ? -1 : 1;
        const x = bits >> 23 & 0xFF;
        const m = bits & 0x7FFFFF;
        if (x === 0x00) return 0;
        if (x === 0xFF) return m ? NaN : s > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
        return s * (m + 0x800000) / 8388608.0 * Math.pow(2, x - 127);
    }

    readBlock(dst, offset, length) {
        for (let i = 0; i < length; ++i) dst[offset + i] = this.buffer[this.index++];
        return length;
    }

    readString(length) {
        let result = "";
        let byte = 0;
        for (let i = 0; i < length; i++) {
            if ((byte = this.readByte(i)) > 0) {
                result += String.fromCharCode(byte);
            }
        }
        return result;
    }
}
