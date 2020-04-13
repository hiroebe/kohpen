import DialogWithInput from './dialogWithInput';
import SyncCanvas from './syncCanvas';

const colors = [
    '#000000',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ffffff',
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
    const dialog = new DialogWithInput('Room ID:', 'Go', 'Cancel');
    dialog.input.type = 'number';
    dialog.okButton.addEventListener('click', () => {
        moveToRoom(dialog.input.value);
    });
    document.getElementById('change-room-btn').addEventListener('click', () => {
        dialog.showModal();
    });
};

const setupColorPalette = (syncCanvas: SyncCanvas) => {
    const container = document.getElementById('color-palette');

    for (const color of colors) {
        const div = document.createElement('div');
        div.className = 'color-palette-button';
        div.style.backgroundColor = color;
        div.style.border = '1px solid black';
        div.addEventListener('click', () => {
            syncCanvas.setColor(color);
        });
        container.appendChild(div);
    }

    const clearButton = document.createElement('div');
    clearButton.className = 'color-palette-button-text';
    clearButton.textContent = 'Clear';
    clearButton.addEventListener('click', () => {
        syncCanvas.clearCanvas();
    });
    container.appendChild(clearButton);
};

const calcCanvasSize = (): number => {
    const canvasContainer = document.getElementById('canvas-container');

    canvasContainer.style.flexGrow = '1';
    canvasContainer.style.alignSelf = 'stretch';

    const { clientWidth, clientHeight } = canvasContainer;

    canvasContainer.style.flexGrow = '0';
    canvasContainer.style.alignSelf = 'center';

    return Math.min(clientWidth * 0.9, clientHeight * 0.9);
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

    const syncCanvas = new SyncCanvas(roomId, calcCanvasSize(), true);
    document.getElementById('canvas-container').appendChild(syncCanvas.element);

    setupDialog();
    setupColorPalette(syncCanvas);
});
