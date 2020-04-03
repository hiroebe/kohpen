import dialogPolyfill from 'dialog-polyfill';
import 'dialog-polyfill/dist/dialog-polyfill.css';

export default class DialogWithInput {
    private _dialog: HTMLDialogElement;
    private _input: HTMLInputElement;
    private _okButton: HTMLButtonElement;
    private _cancelButton: HTMLButtonElement;

    constructor(placeholder: string, okButtonText: string, cancelButtonText: string) {
        this._dialog = document.createElement('dialog');
        dialogPolyfill.registerDialog(this._dialog);

        const form = document.createElement('form');
        form.method = 'dialog';
        this._dialog.appendChild(form);

        this._input = document.createElement('input');
        this._input.placeholder = placeholder;
        form.appendChild(this._input);

        this._okButton = document.createElement('button');
        this._okButton.className = 'styled-link';
        this._okButton.textContent = okButtonText;
        form.appendChild(this._okButton);

        this._cancelButton = document.createElement('button');
        this._cancelButton.className = 'styled-link';
        this._cancelButton.textContent = cancelButtonText;
        form.appendChild(this._cancelButton);

        this._dialog.addEventListener('close', () => {
            this._input.value = '';
        });

        document.body.appendChild(this._dialog);
    }

    get input(): HTMLInputElement {
        return this._input;
    }

    get okButton(): HTMLButtonElement {
        return this._okButton;
    }

    get cancelButton(): HTMLButtonElement {
        return this._cancelButton;
    }

    showModal() {
        this._dialog.showModal();
    }

    close(returnValue?: string) {
        if (returnValue) {
            this._dialog.close(returnValue);
        } else {
            this._dialog.close();
        }
    }
}
