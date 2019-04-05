import * as Long from "long";
import { equal, ok } from "assert";

/**
 * An internal helper class to help deserialize and serialize from and to a `Buffer`.
 */
export class BufferStream {
    private buf: Buffer;
    private _index: number = 0;
    private debug: boolean = false;

    public get index(): number {
        return this._index;
    }

    public constructor(buffer: Buffer, debug: boolean = false) {
        this.buf = buffer;
        this.debug = debug;
    }

    public getByte(): number {
        const out = this.buf.readInt8(this.index);
        this._index++;
        return out;
    }

    public getDouble(): number {
        const out = this.buf.readDoubleBE(this.index);
        this._index += 8;
        return out;
    }

    public getFloat(): number {
        const out = this.buf.readFloatBE(this.index);
        this._index += 4;
        return out;
    }

    public getInt(): number {
        const out = this.buf.readInt32BE(this.index);
        this._index += 4;
        return out;
    }

    public getLong(): Long {
        const arr = this.buf.subarray(this.index, this.index + 8);
        this._index += 8;
        return Long.fromBytesBE([...arr]);
    }

    public getShort(): number {
        const out = this.buf.readInt16BE(this.index);
        this._index += 2;
        return out;
    }

    public getUTF8(): string {
        const len = this.getShort();
        const out = this.buf.toString("utf8", this.index, this.index + len);
        this._index += len;
        return out;
    }

    private expand_by(amount: number) {
        if (this.index + amount >= this.buf.length) {
            this.buf = Buffer.alloc(this.buf.length * 2, this.buf);
        }
    }
    public setByte(value: number): void {
        if (this.debug) {
            equal(this.getByte(), value);
            this._index--;
        }
        this.expand_by(1);
        this.buf.writeInt8(value, this.index);
        this._index++;
    }

    public setDouble(value: number): void {
        if (this.debug) {
            equal(this.getDouble(), value);
            this._index -= 8;
        }
        this.expand_by(8);
        this.buf.writeDoubleBE(value, this.index);
        this._index += 8;
    }

    public setFloat(value: number): void {
        if (this.debug) {
            equal(this.getFloat(), value);
            this._index -= 4;
        }
        this.expand_by(4);
        this.buf.writeFloatBE(value, this.index);
        this._index += 4;
    }

    public setInt(value: number): void {
        if (this.debug) {
            equal(this.getInt(), value);
            this._index -= 4;
        }
        this.expand_by(4);
        this.buf.writeInt32BE(value, this.index);
        this._index += 4;
    }

    public setLong(value: Long): void {
        if (this.debug) {
            ok(this.getLong().equals(value));
            this._index -= 8;
        }
        this.expand_by(8);
        for (const byte of value.toBytesBE()) {
            // TODO: Verify
            this.buf.writeUInt8(byte, this.index);
            this._index++;
        }
    }

    public setShort(value: number): void {
        if (this.debug) {
            equal(this.getShort(), value);
            this._index -= 2;
        }
        this.expand_by(2);
        this.buf.writeInt16BE(value, this.index);
        this._index += 2;
    }

    public setUTF8(value: string): void {
        const startindex = this.index;
        if (this.debug) {
            equal(this.getUTF8(), value);
            this._index = startindex;
        }
        const len = Buffer.byteLength(value, "utf8");
        this.expand_by(len + 1);
        this.setShort(len);
        this.buf.write(value, this.index, undefined, "utf8");
        this._index += len;
    }

    public getData(): Buffer {
        if (this.debug) {
            equal(this.buf.length, this.index);
        }
        return this.buf.slice(0, this.index);
    }
}
