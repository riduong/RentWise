import { LightningElement, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import isPropertyFavorite from '@salesforce/apex/AccountController.isPropertyFavorite';
import toggleFavoriteProperty from '@salesforce/apex/AccountController.toggleFavoriteProperty';

export default class PropertyCard extends NavigationMixin(LightningElement) {
    // API properties that can be set by parent components
    @api property;                     // Property data to display
    @api showFavoriteButton = false;   // Whether to show favorite button
    
    // Internal state
    isFavorite = false;                // Whether property is favorited
    userId = Id;                       // Current user's ID
    wiredFavoriteResult;               // Store wire adapter result

    // Wire service to check if property is favorited
    @wire(isPropertyFavorite, { propertyId: '$property.Id' })
    wiredIsFavorite(result) {
        this.wiredFavoriteResult = result;
        const { data, error } = result;
        if (data !== undefined) {
            this.isFavorite = data;
        } else if (error) {
            console.error('Error checking favorite status:', error);
        }
    }

    // Check if user is logged in
    get isLoggedIn() {
        return this.userId !== undefined && 
               this.userId !== null && 
               this.userId !== '005000000000000';
    }

    // CSS classes for favorite button
    get favoriteButtonClass() {
        return 'favorite-button';
    }

    get favoriteIconClass() {
        return `favorite-icon ${this.isFavorite ? 'favorited' : ''}`;
    }

    get favoriteButtonTitle() {
        return this.isFavorite ? 'Remove from Favorites' : 'Add to Favorites';
    }

    // Format price for display
    get formattedPrice() {
        return this.property?.Price__c?.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }) || '$0';
    }

    // Handle favorite button click
    async handleFavoriteClick(event) {
        // Prevent event from bubbling up to parent
        event.preventDefault();
        event.stopPropagation();
        
        // Show login prompt for guest users
        if (!this.isLoggedIn) {
            this.showLoginPrompt();
            return;
        }

        try {
            // Toggle favorite status
            const isFavorited = await toggleFavoriteProperty({ 
                propertyId: this.property.Id 
            });
            this.isFavorite = isFavorited;
            
            // Refresh the wire adapter to get updated status
            await refreshApex(this.wiredFavoriteResult);
            
            const toast = this.template.querySelector('c-custom-toast');
            if (toast) {
                toast.message = isFavorited ? 'Added to favorites' : 'Removed from favorites';
                toast.variant = 'success';
                toast.show();
            }

            // Notify parent components of the change
            this.dispatchEvent(new CustomEvent('favoritechange', {
                detail: {
                    propertyId: this.property.Id,
                    isFavorite: isFavorited
                },
                bubbles: true,
                composed: true
            }));
        } catch (error) {
            console.error('Error toggling favorite:', error);
            const toast = this.template.querySelector('c-custom-toast');
            if (toast) {
                toast.message = error.body?.message || 'Error updating favorites';
                toast.variant = 'error';
                toast.show();
            }
        }
    }

    // Show login prompt for guest users
    showLoginPrompt() {
        const toast = this.template.querySelector('c-custom-toast');
        if (toast) {
            toast.message = 'Please log in to save properties to your favorites';
            toast.variant = 'info';
            toast.show();
        }
    }

    // Navigate to property detail page
    navigateToProperty() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Property_Detail__c'
            },
            state: {
                propertyId: this.property.Id
            }
        });
    }
}