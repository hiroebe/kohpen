interface Pos {
    x: number;
    y: number;
}

interface DrawInfo {
    method: 'draw' | 'clear';
    color?: string;
    start?: Pos;
    end?: Pos;
}

export default class SyncCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private socket: WebSocket;
    private color: string;
    private mouseX: number;
    private mouseY: number;
    private isMouseDown: boolean;

    constructor(private roomId: string, private canvasSize: number, private drawable: boolean) {
        this.canvas = this.setupCanvas();
        this.ctx = this.setupCanvasContext();
        this.socket = this.setupWebSocket();
        this.color = 'black';
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
    }

    get element(): HTMLCanvasElement {
        return this.canvas;
    }

    close() {
        this.socket.close();
    }

    resize(size: number) {
        this.canvasSize = size;
        this.canvas.width = size;
        this.canvas.height = size;

        this.ctx = this.setupCanvasContext();
    }

    setColor(color: string) {
        this.color = color;
    }

    clearCanvas() {
        this.drawAndSend({ method: 'clear' });
    }

    private setupCanvas(): HTMLCanvasElement {
        const canvas = document.createElement('canvas');

        canvas.width = this.canvasSize;
        canvas.height = this.canvasSize;

        if (this.drawable) {
            canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
            canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
            canvas.addEventListener('mouseup', this.onDrawEnd.bind(this));
            canvas.addEventListener('mouseout', this.onDrawEnd.bind(this));
            canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
            canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
            canvas.addEventListener('touchend', this.onDrawEnd.bind(this));
            canvas.addEventListener('touchcancel', this.onDrawEnd.bind(this));
        }

        return canvas;
    }

    private setupCanvasContext(): CanvasRenderingContext2D {
        const ctx = this.canvas.getContext('2d', { alpha: false });

        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

        return ctx;
    }

    private setupWebSocket(): WebSocket {
        let proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = new URL(proto + window.location.host + '/ws');
        url.searchParams.set('r', this.roomId);

        const sock = new WebSocket(url.toString());

        sock.addEventListener('open', () => {
            console.log('connected');
        });
        sock.addEventListener('close', () => {
            console.log('disconnected');
        });
        sock.addEventListener('message', (e: MessageEvent) => {
            const drawInfo: DrawInfo = JSON.parse(e.data);
            this.draw(drawInfo);
        });

        return sock;
    }

    private drawAndSend(info: DrawInfo) {
        this.draw(info);
        this.socket.send(JSON.stringify(info));
    }

    private draw(info: DrawInfo) {
        const { method, color, start, end } = info;

        switch (method) {
            case 'draw':
                this.ctx.strokeStyle = color;
                this.ctx.beginPath();
                this.ctx.moveTo(start.x * this.canvasSize, start.y * this.canvasSize);
                this.ctx.lineTo(end.x * this.canvasSize, end.y * this.canvasSize);
                this.ctx.stroke();
                break;

            case 'clear':
                this.ctx.fillStyle = 'white';
                this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);
                break;
        }
    }

    private onDrawStart(x: number, y: number) {
        this.drawAndSend({
            method: 'draw',
            color: this.color,
            start: {
                x: x / this.canvasSize,
                y: y / this.canvasSize,
            },
            end: {
                x: x / this.canvasSize,
                y: y / this.canvasSize,
            },
        });
        this.isMouseDown = true;
        this.mouseX = x;
        this.mouseY = y;
    }

    private onDrawMove(x: number, y: number) {
        this.drawAndSend({
            method: 'draw',
            color: this.color,
            start: {
                x: this.mouseX / this.canvasSize,
                y: this.mouseY / this.canvasSize,
            },
            end: {
                x: x / this.canvasSize,
                y: y / this.canvasSize,
            },
        });
        this.mouseX = x;
        this.mouseY = y;
    }

    private onDrawEnd() {
        this.isMouseDown = false;
    }

    private onTouchStart(e: TouchEvent) {
        e.preventDefault();

        const touch = e.touches[0];
        this.onDrawStart(touch.clientX - this.canvas.offsetLeft, touch.clientY - this.canvas.offsetTop);
    }

    private onTouchMove(e: TouchEvent) {
        e.preventDefault();

        const touch = e.touches[0];
        this.onDrawMove(touch.clientX - this.canvas.offsetLeft, touch.clientY - this.canvas.offsetTop);
    }

    private onMouseDown(e: MouseEvent) {
        this.onDrawStart(e.offsetX, e.offsetY);
    }

    private onMouseMove(e: MouseEvent) {
        if (!this.isMouseDown) {
            return;
        }
        this.onDrawMove(e.offsetX, e.offsetY);
    }
}
