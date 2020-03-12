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
    private mouseX: number;
    private mouseY: number;
    private isMouseDown: boolean;

    constructor() {
        this.canvas = this.setupCanvas();
        this.ctx = this.setupCanvasContext();
        this.socket = this.setupWebSocket();
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
    }

    private setupCanvas(): HTMLCanvasElement {
        const canvas = document.getElementsByTagName('canvas')[0];

        const size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
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
            console.log(e);
            const drawInfo = JSON.parse(e.data);
            this.draw(drawInfo);
        });

        return sock;
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
            color: '#ff0000',
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
            color: '#ff0000',
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
        this.onDrawStart(touch.pageX, touch.pageY);
    }

    private onTouchMove(e: TouchEvent) {
        e.preventDefault();

        const touch = e.touches[0];
        this.onDrawMove(touch.pageX, touch.pageY);
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

    document.getElementById('change-room-btn').addEventListener('click', () => {
        (document.getElementById('change-room-dialog') as HTMLDialogElement).showModal();
    });

    document.getElementById('change-room-dialog-go-btn').addEventListener('click', () => {
        const roomId = (document.getElementById('change-room-dialog-input') as HTMLInputElement).value;
        moveToRoom(roomId);
    });

    new SyncCanvas();
});
