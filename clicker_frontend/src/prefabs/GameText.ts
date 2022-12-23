// import gText = Phaser.GameObjects.Text;
// import RetroPixelFont from '../assets/fonts/RetroGaming.ttf';

export default class GameText {
    private ctx: any;
    private x: number;
    private y: number;
    private text: string;
    private style: { font: string; color: string; fontSize: number; align: string };
    private origin: any;
    private obj: any;
    constructor(ctx: any, x: number, y: number, string: string, style: string, origin: any) {
        this.ctx = ctx;
        
        this.x = x;
        this.y = y;
        
        this.text = string;

        this.style = this.initStyle(style);
        this.origin = this.initOrigin(origin);

        this.obj = this.createText();
    }

    // Init
    initStyle (key: string) {
        let style = {
            font: 'RetroPixelFont',
            fontSize: 32,
            color: '0xFFFFFF',
            align: 'center'
        };

        switch (key.toLowerCase()) {
            case 'title':
                style.fontSize = 64;
                break;
            case 'preload':
                style.fontSize = 48;
                break;
        }

        return style;
    }

    initOrigin (origin: any) {
        if (typeof origin === 'number') {
            return {
                x: origin,
                y: origin
            };
        } else if (typeof origin === 'object') {
            return origin;
        } else {
            return {
                x: 0.5,
                y: 0.5,
            };
        }
    }

    // Text object
    createText() {
        let obj = this.ctx.add.bitmapText(
            this.x,
            this.y,
            this.style.font,
            this.text,
            this.style.fontSize,
            this.style.align
        );

        obj.setOrigin(this.origin.x, this.origin.y);

        return obj;
    }

    destroy() {
        this.obj.destroy();

        // this.obj = false;
    }

    // Setters
    setText (string: string) {
        this.text = string;
        this.obj.setText(string);
    }

    setX (x: number) {
        this.x = x;
        this.obj.setX(x);
    }

    setY (y: number) {
        this.y = y;
        this.obj.setY(y);
    }

    setOrigin (origin: number | undefined) {
        this.origin = this.initOrigin(origin);
        this.obj.setOrigin(origin);
    }

    setDepth (depth: number) {
        this.obj.setDepth(depth);
    }

    setScrollFactor (scrollX: number, scrollY: number | undefined) {
        this.obj.setScrollFactor(scrollX, scrollY);
    }

    // Getters
    getCenter () {
        return this.obj.getCenter();
    }

    getTopLeft () {
        return this.obj.getTopLeft();
    }

    getTopRight () {
        return this.obj.getTopRight();
    }

    getBottomLeft () {
        return this.obj.getBottomLeft();
    }

    getBottomRight () {
        return this.obj.getBottomRight();
    }
}