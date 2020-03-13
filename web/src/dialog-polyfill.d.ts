declare module 'dialog-polyfill' {
    interface DialogPolyfill {
        registerDialog(dialog: HTMLDialogElement): void;
    }

    var dialogPolyfill: DialogPolyfill;
    export default dialogPolyfill;
}
