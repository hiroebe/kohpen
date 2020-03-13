import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dist/dialog-polyfill.css';

const colors = [
    '#000000',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
];

interface Pos {
    x: number;
    y: number;
}

interface DrawInfo {
    color: string;
    start: Pos;
    end: Pos;
}

class SyncCanvas {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private socket: WebSocket;
    private color: string;
    private mouseX: number;
    private mouseY: number;
    private isMouseDown: boolean;

    constructor() {
        this.canvas = this.setupCanvas();
        this.ctx = this.setupCanvasContext();
        this.socket = this.setupWebSocket();
        this.color = colors[0];
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;

        this.setupColorPalette();
    }

    private setupCanvas(): HTMLCanvasElement {
        const canvas = document.querySelector('canvas');

        const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8);
        canvas.width = size;
        canvas.height = size;

        canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        canvas.addEventListener('mouseup', this.onDrawEnd.bind(this));
        canvas.addEventListener('mouseout', this.onDrawEnd.bind(this));
        canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        canvas.addEventListener('touchend', this.onDrawEnd.bind(this));
        canvas.addEventListener('touchcancel', this.onDrawEnd.bind(this));

        return canvas;
    }

    private setupCanvasContext(): CanvasRenderingContext2D {
        const ctx = this.canvas.getContext('2d', { alpha: false });

        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        return ctx;
    }

    private setupWebSocket(): WebSocket {
        const loc = window.location;
        let proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
        const sock = new WebSocket(proto + loc.host + '/ws' + loc.search);

        sock.addEventListener('open', () => {
            console.log('connected');
        });
        sock.addEventListener('close', () => {
            console.log('disconnected');
        });
        sock.addEventListener('message', (e: MessageEvent) => {
            const drawInfo = JSON.parse(e.data);
            this.draw(drawInfo);
        });

        return sock;
    }

    private setupColorPalette() {
        const container = document.getElementById('color-palette');
        for (const color of colors) {
            const div = document.createElement('div');
            div.className = 'color-palette-button';
            div.style.backgroundColor = color;
            div.onclick = () => {
                this.color = color;
            };
            container.appendChild(div);
        }
    }

    private drawAndSend(info: DrawInfo) {
        this.draw(info);
        this.socket.send(JSON.stringify(info));
    }

    private draw(info: DrawInfo) {
        const { color, start, end } = info;

        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
        this.ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
        this.ctx.stroke();
    }

    private onDrawStart(x: number, y: number) {
        this.drawAndSend({
            color: this.color,
            start: {
                x: x / this.canvas.width,
                y: y / this.canvas.height,
            },
            end: {
                x: x / this.canvas.width,
                y: y / this.canvas.height,
            },
        });
        this.isMouseDown = true;
        this.mouseX = x;
        this.mouseY = y;
    }

    private onDrawMove(x: number, y: number) {
        this.drawAndSend({
            color: this.color,
            start: {
                x: this.mouseX / this.canvas.width,
                y: this.mouseY / this.canvas.height,
            },
            end: {
                x: x / this.canvas.width,
                y: y / this.canvas.height,
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

const generateRoomId = (): number => {
    return Math.floor(Math.random() * 1000000)
};

const moveToRoom = (roomId: string) => {
    const url = new URL(document.location.toString());
    url.searchParams.set('r', roomId);
    window.location.href = url.toString();
};

const setupDialog = () => {
    const dialog = document.getElementById('change-room-dialog') as HTMLDialogElement;
    dialogPolyfill.registerDialog(dialog);

    document.getElementById('change-room-btn').addEventListener('click', () => {
        dialog.showModal();
    });

    document.getElementById('change-room-dialog-go-btn').addEventListener('click', () => {
        const roomId = (document.getElementById('change-room-dialog-input') as HTMLInputElement).value;
        moveToRoom(roomId);
    });

    document.getElementById('change-room-dialog-cancel-btn').addEventListener('click', () => {
        dialog.close();
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const url = new URL(document.location.toString());
    const roomId = url.searchParams.get('r');
    if (!roomId) {
        console.log('roomId is not set!');
        moveToRoom(String(generateRoomId()));
        url.searchParams.set('r', String(generateRoomId()));
        window.location.href = url.toString();
        return;
    }
    document.getElementById('room-id').textContent = roomId;

    setupDialog();

    new SyncCanvas();
});
