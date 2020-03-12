var SyncCanvas = /** @class */ (function () {
    function SyncCanvas() {
        this.canvas = this.setupCanvas();
        this.ctx = this.setupCanvasContext();
        this.socket = this.setupWebSocket();
        this.mouseX = 0;
        this.mouseY = 0;
        this.isMouseDown = false;
    }
    SyncCanvas.prototype.setupCanvas = function () {
        var canvas = document.getElementsByTagName('canvas')[0];
        var size = Math.min(window.innerWidth, window.innerHeight) * 0.9;
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
    };
    SyncCanvas.prototype.setupCanvasContext = function () {
        var ctx = this.canvas.getContext('2d', { alpha: false });
        ctx.lineCap = 'round';
        ctx.lineWidth = 4;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        return ctx;
    };
    SyncCanvas.prototype.setupWebSocket = function () {
        var _this = this;
        var loc = window.location;
        var proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
        var sock = new WebSocket(proto + loc.host + '/ws' + loc.search);
        sock.addEventListener('open', function () {
            console.log('connected');
        });
        sock.addEventListener('close', function () {
            console.log('disconnected');
        });
        sock.addEventListener('message', function (e) {
            console.log(e);
            var drawInfo = JSON.parse(e.data);
            _this.draw(drawInfo);
        });
        return sock;
    };
    SyncCanvas.prototype.drawAndSend = function (info) {
        this.draw(info);
        this.socket.send(JSON.stringify(info));
    };
    SyncCanvas.prototype.draw = function (info) {
        var color = info.color, start = info.start, end = info.end;
        this.ctx.strokeStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(start.x * this.canvas.width, start.y * this.canvas.height);
        this.ctx.lineTo(end.x * this.canvas.width, end.y * this.canvas.height);
        this.ctx.stroke();
    };
    SyncCanvas.prototype.onDrawStart = function (x, y) {
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
    };
    SyncCanvas.prototype.onDrawMove = function (x, y) {
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
    };
    SyncCanvas.prototype.onDrawEnd = function () {
        this.isMouseDown = false;
    };
    SyncCanvas.prototype.onTouchStart = function (e) {
        e.preventDefault();
        var touch = e.touches[0];
        this.onDrawStart(touch.pageX, touch.pageY);
    };
    SyncCanvas.prototype.onTouchMove = function (e) {
        e.preventDefault();
        var touch = e.touches[0];
        this.onDrawMove(touch.pageX, touch.pageY);
    };
    SyncCanvas.prototype.onMouseDown = function (e) {
        this.onDrawStart(e.offsetX, e.offsetY);
    };
    SyncCanvas.prototype.onMouseMove = function (e) {
        if (!this.isMouseDown) {
            return;
        }
        this.onDrawMove(e.offsetX, e.offsetY);
    };
    return SyncCanvas;
}());
var generateRoomId = function () {
    return Math.floor(Math.random() * 1000000);
};
var moveToRoom = function (roomId) {
    var url = new URL(document.location.toString());
    url.searchParams.set('r', roomId);
    window.location.href = url.toString();
};
document.addEventListener('DOMContentLoaded', function () {
    var url = new URL(document.location.toString());
    var roomId = url.searchParams.get('r');
    if (!roomId) {
        console.log('roomId is not set!');
        moveToRoom(String(generateRoomId()));
        url.searchParams.set('r', String(generateRoomId()));
        window.location.href = url.toString();
        return;
    }
    document.getElementById('change-room-btn').addEventListener('click', function () {
        document.getElementById('change-room-dialog').showModal();
    });
    document.getElementById('change-room-dialog-go-btn').addEventListener('click', function () {
        var roomId = document.getElementById('change-room-dialog-input').value;
        moveToRoom(roomId);
    });
    new SyncCanvas();
});
//# sourceMappingURL=main.js.map