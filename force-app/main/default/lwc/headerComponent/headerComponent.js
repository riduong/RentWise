import { LightningElement, wire } from 'lwc';
import Id from '@salesforce/user/Id';
import { NavigationMixin } from 'lightning/navigation';

export default class HeaderComponent extends NavigationMixin(LightningElement) {
    userId = Id;

    get isLoggedIn() {
        return this.userId !== undefined && this.userId !== null && this.userId !== '005000000000000';
    }

    handleLogout() {
        // Navigate to the Salesforce logout URL
        window.location.href = '/secur/logout.jsp';
    }
}