import { LightningElement, api } from 'lwc';

export default class CustomToast extends LightningElement {
    @api message;
    @api variant = 'success';
    @api autoClose = false;
    showToast = false;

    @api
    show() {
        this.showToast = true;
        if (this.autoClose) {
            setTimeout(() => {
                this.close();
            }, 3000);
        }
    }

    @api
    close() {
        this.showToast = false;
    }

    get toastClass() {
        return `custom-toast ${this.variant} ${this.showToast ? 'show' : ''}`;
    }

    handleClose() {
        this.close();
    }
}