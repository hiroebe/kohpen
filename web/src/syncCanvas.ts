const moveEventTimeout = 30;
const sendTimeout = 100;

interface Message {
    method: 'draw' | 'clear' | 'history-request' | 'history-response';
    data?: DrawInfo | DrawInfo[];
}

interface DrawInfo {
    color: string;
    paths: [Pos, Pos][];
}

class Pos {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toJSON() {
        return {
            x: this.x.toFixed(4),
            y: this.y.toFixed(4),
        };
    }
}

export default class SyncCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private socket: WebSocket;
    private color: string;
    private mouseX: number;
    private mouseY: number;
    private isMouseDown: boolean;
    private drawHistory: DrawInfo[];
    private moveEventTimer: number;
    private sendTimer: number;
    private sendQueue: [Pos, Pos][];

    constructor(private roomId: string, private canvasSize: number, private drawable: boolean) {
        this.canvas = this.setupCanvas();
        this.ctx = this.setupCanvasContext();
        this.socket = this.setupWebSocket();
        this.color = 'black';
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
        this.drawHistory = [];
        this.moveEventTimer = null;
        this.sendTimer = null;
        this.sendQueue = [];
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
        this.flushSendQueue();
        this.color = color;
    }

    clearCanvas() {
        this.clear();
        this.sendMessage({
            method: 'clear',
        });
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
            this.sendMessage({ method: 'history-request' });
        });
        sock.addEventListener('close', () => {
            console.log('disconnected');
        });
        sock.addEventListener('message', (e: MessageEvent) => {
            const message: Message = JSON.parse(e.data);
            this.handleMessage(message);
        });

        return sock;
    }

    private handleMessage(message: Message) {
        console.log(message);
        switch (message.method) {
            case 'draw':
                this.draw(message.data as DrawInfo);
                break;

            case 'clear':
                this.clear();
                break;

            case 'history-request':
                this.sendMessage({
                    method: 'history-response',
                    data: this.drawHistory,
                });
                break;

            case 'history-response':
                for (const drawInfo of (message.data as DrawInfo[])) {
                    this.draw(drawInfo);
                }
                break;
        }
    }

    private sendMessage(message: Message) {
        this.socket.send(JSON.stringify(message));
    }

    private drawAndSend(info: DrawInfo) {
        this.draw(info);

        this.sendQueue.push(...info.paths);

        if (this.sendTimer) {
            return;
        }

        this.sendTimer = window.setTimeout(() => {
            this.flushSendQueue();
            this.sendTimer = null;
        }, sendTimeout);
    }

    private flushSendQueue() {
        if (!this.sendQueue) {
            return;
        }
        this.sendMessage({
            method: 'draw',
            data: {
                color: this.color,
                paths: this.sendQueue,
            },
        });
        this.sendQueue = [];
    }

    private draw(info: DrawInfo) {
        this.ctx.strokeStyle = info.color;
        this.ctx.beginPath();
        for (const [start, end] of info.paths) {
            this.ctx.moveTo(start.x * this.canvasSize, start.y * this.canvasSize);
            this.ctx.lineTo(end.x * this.canvasSize, end.y * this.canvasSize);
        }
        this.ctx.stroke();

        this.addToHistory(info);
    }

    private addToHistory(info: DrawInfo) {
        const last = this.drawHistory.length - 1;
        if (last >= 0 && info.color === this.drawHistory[last].color) {
            this.drawHistory[last].paths.push(...info.paths);
        } else {
            this.drawHistory.push(info);
        }
    }

    private clear() {
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvasSize, this.canvasSize);

        this.drawHistory = [];
    }

    private onDrawStart(x: number, y: number) {
        const start = new Pos(x / this.canvasSize, y / this.canvasSize);
        const end = new Pos(x / this.canvasSize, y / this.canvasSize);
        this.drawAndSend({
            color: this.color,
            paths: [[start, end]],
        });
        this.isMouseDown = true;
        this.mouseX = x;
        this.mouseY = y;
    }

    private onDrawMove(x: number, y: number) {
        if (this.moveEventTimer) {
            return;
        }

        const start = new Pos(this.mouseX / this.canvasSize, this.mouseY / this.canvasSize);
        const end = new Pos(x / this.canvasSize, y / this.canvasSize);
        this.drawAndSend({
            color: this.color,
            paths: [[start, end]],
        });
        this.mouseX = x;
        this.mouseY = y;

        this.moveEventTimer = window.setTimeout(() => {
            this.moveEventTimer = null;
        }, moveEventTimeout);
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
