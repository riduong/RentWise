import { LightningElement, wire, track } from 'lwc';
import { CurrentPageReference } from 'lightning/navigation';
import { refreshApex } from '@salesforce/apex';
import Id from '@salesforce/user/Id';
import getPropertyById from '@salesforce/apex/PropertyController.getPropertyById';
import getPropertyImages from '@salesforce/apex/PropertyController.getPropertyImages';
import isPropertyFavorite from '@salesforce/apex/AccountController.isPropertyFavorite';
import toggleFavoriteProperty from '@salesforce/apex/AccountController.toggleFavoriteProperty';
import getMapMarkers from '@salesforce/apex/MapHelper.getMapMarkers';
import submitContactRequest from '@salesforce/apex/ContactAgentController.submitContactRequest';

export default class PropertyDetail extends LightningElement {
    // Track reactive properties
    @track propertyId;          // ID of the current property being viewed
    @track property;            // Full property details
    @track error;              // Any error messages
    @track isLoading = true;    // Loading state for the main content
    @track isImageLoading = true; // Loading state for images
    @track isFavorite = false;  // Whether the current property is favorited
    @track propertyImages = []; // Array of property images
    @track mapMarkers = [];     // Markers for the map component
    @track mapLoading = false;  // Loading state for map
    @track mapError = false;    // Error state for map
    @track showContactModal = false; // Controls visibility of contact form modal
    @track isSubmitting = false;     // Contact form submission state
    
    // Contact form data structure
    @track contactForm = {
        firstName: '',
        lastName: '',
        email: '',
        message: ''
    };
    
    userId = Id;  // Current user's ID
    wiredFavoriteResult;  // Stores wire adapter result for refresh capabilities
    currentImageIndex = 0;  // Tracks current image in carousel

    // Wire service to get property ID from URL parameters
    @wire(CurrentPageReference)
    getPageRef(pageRef) {
        if (pageRef?.state?.propertyId && pageRef.state.propertyId !== this.propertyId) {
            this.propertyId = pageRef.state.propertyId;
            this.loadProperty();  // Load property when ID changes
        }
    }

    // Wire service to check if property is favorited
    @wire(isPropertyFavorite, { propertyId: '$propertyId' })
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

    // CSS class getters for favorite button
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
        });
    }

    // Various state check getters
    get hasError() {
        return this.error != null;
    }

    get hasProperty() {
        return this.property != null;
    }

    get hasMapMarker() {
        return this.mapMarkers && this.mapMarkers.length > 0;
    }

    get hasMultipleImages() {
        return this.propertyImages.length > 1;
    }

    // Image carousel getters
    get currentImage() {
        return this.propertyImages.length > 0 ? 
            this.propertyImages[this.currentImageIndex] : null;
    }

    get displayImageIndex() {
        return this.currentImageIndex + 1;
    }

    // Map configuration
    get mapOptions() {
        return {
            draggable: false,
            disableDefaultUI: true,
            zoomControl: true
        };
    }

    // Image navigation methods
    handleNextImage() {
        if (this.currentImageIndex < this.propertyImages.length - 1) {
            this.currentImageIndex++;
        } else {
            this.currentImageIndex = 0;
        }
    }

    handlePreviousImage() {
        if (this.currentImageIndex > 0) {
            this.currentImageIndex--;
        } else {
            this.currentImageIndex = this.propertyImages.length - 1;
        }
    }

    // Main method to load property details
    async loadProperty() {
        if (!this.propertyId) return;
        
        try {
            this.isLoading = true;
            this.error = null;
            
            // Load main property details
            this.property = await getPropertyById({ propertyId: this.propertyId });
            
            if (this.property) {
                // Load property images
                const images = await getPropertyImages({ propertyId: this.propertyId });
                if (images && images.length > 0) {
                    this.propertyImages = images;
                } else {
                    this.propertyImages = ['/resource/DefaultPropertyImage'];
                }

                // Load map marker if address exists
                if (this.property.Location_Address__c) {
                    this.mapLoading = true;
                    try {
                        const markers = await getMapMarkers({ 
                            address: this.property.Location_Address__c,
                            propertyName: this.property.Name 
                        });
                        
                        if (markers && markers.length > 0) {
                            this.mapMarkers = markers;
                            this.mapError = false;
                        } else {
                            this.mapMarkers = [];
                            this.mapError = true;
                        }
                    } catch (mapError) {
                        console.error('Error loading map:', mapError);
                        this.mapError = true;
                        this.mapMarkers = [];
                    } finally {
                        this.mapLoading = false;
                    }
                }

                // Refresh favorite status
                await refreshApex(this.wiredFavoriteResult);
            }
        } catch (error) {
            this.error = error.message || 'An error occurred while loading the property';
            console.error('Error loading property:', error);
        } finally {
            this.isLoading = false;
        }
    }

    // Image loading handlers
    handleImageLoad() {
        this.isImageLoading = false;
    }

    handleImageError() {
        this.isImageLoading = false;
        if (!this.propertyImages.includes('/resource/DefaultPropertyImage')) {
            this.propertyImages = ['/resource/DefaultPropertyImage'];
        }
    }

    // Favorite functionality
    async handleFavoriteClick() {
        if (!this.isLoggedIn) {
            const toast = this.template.querySelector('c-custom-toast');
            if (toast) {
                toast.message = 'Please log in to save properties';
                toast.variant = 'info';
                toast.show();
            }
            return;
        }

        try {
            const isFavorited = await toggleFavoriteProperty({ 
                propertyId: this.propertyId 
            });
            
            // Update local state and refresh wire adapter
            this.isFavorite = isFavorited;
            await refreshApex(this.wiredFavoriteResult);
            
            // Notify parent components
            this.dispatchEvent(new CustomEvent('favoritechange', {
                detail: {
                    propertyId: this.propertyId,
                    isFavorite: isFavorited
                },
                bubbles: true,
                composed: true
            }));
            
            // Show success toast
            const toast = this.template.querySelector('c-custom-toast');
            if (toast) {
                toast.message = isFavorited ? 
                    'Added to favorites' : 'Removed from favorites';
                toast.variant = 'success';
                toast.show();
            }
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

    // Contact form methods
    handleContactAgentClick() {
        this.showContactModal = true;
    }

    closeModal() {
        this.showContactModal = false;
        this.resetContactForm();
    }

    handleInputChange(event) {
        const field = event.target.dataset.field;
        this.contactForm[field] = event.target.value;
    }

    // Handle contact form submission
    async handleSubmitForm() {
        if (!this.validateForm()) return;

        try {
            const result = await submitContactRequest({
                request: {
                    ...this.contactForm,
                    propertyId: this.propertyId
                }
            });

            if (result) {
                const toast = this.template.querySelector('c-custom-toast');
                if (toast) {
                    toast.message = 'Message sent successfully!';
                    toast.variant = 'success';
                    toast.show();
                }
                this.closeModal();
            }
        } catch (error) {
            const toast = this.template.querySelector('c-custom-toast');
            if (toast) {
                toast.message = error.body?.message || 'Error sending message';
                toast.variant = 'error';
                toast.show();
            }
        }
    }

    // Form validation helper
    validateForm() {
        if (!this.contactForm.lastName) {
            const toast = this.template.querySelector('c-custom-toast');
            if (toast) {
                toast.message = 'Last Name is required';
                toast.variant = 'error';
                toast.show();
            }
            return false;
        }
        return true;
    }

    // Reset contact form helper
    resetContactForm() {
        this.contactForm = {
            firstName: '',
            lastName: '',
            email: '',
            message: ''
        };
    }
}