import { LightningElement, wire, track } from 'lwc';
import { getRecord } from 'lightning/uiRecordApi';
import Id from '@salesforce/user/Id';
import NAME_FIELD from '@salesforce/schema/User.Name';
import EMAIL_FIELD from '@salesforce/schema/User.Email';
import getSavedProperties from '@salesforce/apex/AccountController.getSavedProperties';
import { refreshApex } from '@salesforce/apex';

export default class AccountPage extends LightningElement {
    // Track these properties for reactive updates in the UI
    @track userName;
    @track userEmail;
    @track savedProperties = [];
    
    // Store the current user's ID
    userId = Id;
    
    // Store the wire adapter result for refresh capability
    wiredPropertiesResult;

    // Wire service to get user information using the current user's ID
    // This automatically updates when user data changes
    @wire(getRecord, { recordId: '$userId', fields: [NAME_FIELD, EMAIL_FIELD] })
    userInfo({ error, data }) {
        if (data) {
            // Extract name and email from the user record
            this.userName = data.fields.Name.value;
            this.userEmail = data.fields.Email.value;
        }
    }

    // Wire service to get properties saved by the current user
    // This automatically updates when saved properties change
    @wire(getSavedProperties)
    wiredSavedProperties(result) {
        // Store the wire result for refresh operations
        this.wiredPropertiesResult = result;
        const { data, error } = result;
        if (data) {
            // Create a new array with the saved properties
            // Using spread operator to create a new array instance
            this.savedProperties = [...data];
        }
    }

    // Handle when a property's favorite status changes
    handleFavoriteChange(event) {
        // Extract property ID and favorite status from the event
        const { propertyId, isFavorite } = event.detail;
        
        if (!isFavorite) {
            // If property is unfavorited, remove it from local state immediately
            this.savedProperties = this.savedProperties.filter(prop => prop.Id !== propertyId);
            
            // Refresh the data from the server to ensure sync
            refreshApex(this.wiredPropertiesResult);
        }
    }

    // Lifecycle hook that runs when component is inserted into the DOM
    connectedCallback() {
        // Refresh saved properties when component loads
        refreshApex(this.wiredPropertiesResult);
    }
}