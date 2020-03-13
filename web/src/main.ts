import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dist/dialog-polyfill.css';
import SyncCanvas from './syncCanvas';

const colors = [
    '#000000',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
];

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

const setupColorPalette = (syncCanvas: SyncCanvas) => {
    const container = document.getElementById('color-palette');

    for (const color of colors) {
        const div = document.createElement('div');
        div.className = 'color-palette-button';
        div.style.backgroundColor = color;
        div.addEventListener('click', () => {
            syncCanvas.setColor(color);
        });
        container.appendChild(div);
    }

    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', () => {
        syncCanvas.clearCanvas();
    });
    container.appendChild(clearButton);
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

    const canvasSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.8);
    const syncCanvas = new SyncCanvas(canvasSize, true);
    document.getElementById('canvas-container').appendChild(syncCanvas.element);

    setupDialog();
    setupColorPalette(syncCanvas);
});
