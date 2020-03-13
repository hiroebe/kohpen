import DialogWithInput from './dialogWithInput';
import SyncCanvas from './syncCanvas';

class RoomViewer {
	private container: HTMLDivElement;
	private dialog: DialogWithInput;
	private syncCanvas: SyncCanvas;

	constructor(canvasSize: number) {
		this.container = this.createContainer(canvasSize);
		this.dialog = this.createDialog(canvasSize);

		this.container.addEventListener('click', () => {
			this.dialog.showModal();
		});
	}

	get element(): HTMLDivElement {
		return this.container;
	}

	private createContainer(canvasSize: number): HTMLDivElement {
		const container = document.createElement('div');
		container.className = 'canvas-container';
		container.innerHTML = 'Tap to view a room';
		container.style.width = canvasSize + 'px';
		container.style.height = canvasSize + 'px';
		container.style.border = '1px solid black';

		return container;
	}

	private createDialog(canvasSize: number): DialogWithInput {
		const dialog = new DialogWithInput('Room ID: ', 'OK', 'Cancel');
		dialog.okButton.addEventListener('click', () => {
			if (this.syncCanvas) {
				this.syncCanvas.close();
			}

			const roomId = this.dialog.input.value;
			this.syncCanvas = new SyncCanvas(roomId, canvasSize, false);

			this.container.innerHTML = '';
			this.container.appendChild(this.createRoomIdLabel(roomId));
			this.container.appendChild(this.syncCanvas.element);
		});

		return dialog;
	}

	private createRoomIdLabel(roomId: string): HTMLDivElement {
		const roomIdLabel = document.createElement('div');
		roomIdLabel.style.position = 'absolute';
		roomIdLabel.textContent = 'Room ID: ' + roomId;

		return roomIdLabel;
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const canvasSize = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.45);
	for (let i = 0; i < 2; i++) {
		const roomViewer = new RoomViewer(canvasSize);
		document.getElementById('container').appendChild(roomViewer.element);
	}
});
