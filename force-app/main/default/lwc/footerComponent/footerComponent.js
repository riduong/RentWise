import { LightningElement } from 'lwc';

export default class FooterComponent extends LightningElement {
    openEmailPopup(event) {
        event.preventDefault(); // Prevent default anchor behavior
        window.location.href = "mailto:richardduong507@gmail.com";
    }
}