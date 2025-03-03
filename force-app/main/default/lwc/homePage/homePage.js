import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getFeaturedListings from '@salesforce/apex/HomePageController.getFeaturedListings';
import searchProperties from '@salesforce/apex/HomePageController.searchProperties';
import getPropertyImages from '@salesforce/apex/PropertyController.getPropertyImages';

export default class HomePage extends NavigationMixin(LightningElement) {
    // Track these properties for reactivity
    @track featuredListings = [];   // Featured properties to display
    @track searchResults = [];      // Search results
    @track searchAddress = '';      // Search input value
    @track isSearching = false;     // Search loading state
    @track isLoadingFeatured = true; // Featured listings loading state

    // Wire service to get featured listings when component loads
    @wire(getFeaturedListings)
    async wiredListings({ data, error }) {
        this.isLoadingFeatured = true;
        if (data) {
            try {
                // Process each listing to add additional information
                const processedListings = await Promise.all(
                    data.map(async (property) => {
                        // Add text about rental days
                        const processedProperty = {
                            ...property,
                            daysRentedText: `Rented for ${property.Days_Rented__c} days last year`
                        };

                        // Load property images
                        try {
                            const images = await getPropertyImages({ propertyId: property.Id });
                            processedProperty.Primary_Image__c = images?.length ? 
                                images[0] : '/resource/DefaultPropertyImage';
                        } catch (err) {
                            console.error('Error fetching images:', err);
                            processedProperty.Primary_Image__c = '/resource/DefaultPropertyImage';
                        }

                        return processedProperty;
                    })
                );
                
                this.featuredListings = processedListings;
            } catch (err) {
                console.error('Error processing listings:', err);
                this.showErrorToast('Error loading featured listings');
            }
        } else if (error) {
            console.error('Error fetching listings:', error);
            this.showErrorToast('Error loading featured listings');
        }
        this.isLoadingFeatured = false;
    }

    // Handle clicking on a carousel image
    handleCarouselImageClick(event) {
        event.preventDefault();
        event.stopPropagation();
        // Navigate to property detail page
        const propertyId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Property_Detail__c'
            },
            state: {
                propertyId: propertyId
            }
        });
    }

    // Search functionality
    handleSearchInput(event) {
        this.searchAddress = event.target.value;
    }

    // Handle enter key in search
    handleKeyPress(event) {
        if (event.keyCode === 13 || event.key === 'Enter') {
            this.handleSearch();
        }
    }

    // Main search method
    handleSearch() {
        if (!this.searchAddress) return;
        
        this.isSearching = true;
        searchProperties({ searchAddress: this.searchAddress })
            .then(results => {
                this.searchResults = results;
                if (results.length === 0) {
                    this.showInfoToast('No properties found matching your search');
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                this.showErrorToast('Error performing search');
            })
            .finally(() => {
                this.isSearching = false;
            });
    }

    // Handle property card clicks
    handlePropertyClick(event) {
        event.preventDefault();
        event.stopPropagation();
        // Navigate to property detail
        const propertyId = event.currentTarget.dataset.id;
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                name: 'Property_Detail__c'
            },
            state: {
                propertyId: propertyId
            }
        });
    }

    // Handle favorite changes
    handleFavoriteChange(event) {
        const toast = this.template.querySelector('c-custom-toast');
        if (toast) {
            toast.message = event.detail.isFavorite ? 
                'Property saved to favorites' : 
                'Property removed from favorites';
            toast.variant = 'success';
            toast.show();
        }
    }

    // Lifecycle hook when component is rendered
    renderedCallback() {
        // Add observer for carousel changes to update active details
        const carousel = this.template.querySelector('lightning-carousel');
        if (carousel) {
            carousel.addEventListener('slide', (event) => {
                // Update which property details are visible
                const details = this.template.querySelectorAll('.featured-details');
                details.forEach(detail => {
                    detail.classList.remove('slds-is-active');
                });
                const activeDetail = this.template.querySelector(
                    `.featured-details[data-id="${this.featuredListings[event.detail].Id}"]`
                );
                if (activeDetail) {
                    activeDetail.classList.add('slds-is-active');
                }
            });
            
            // Show first property details by default
            if (this.featuredListings.length > 0) {
                const firstDetail = this.template.querySelector(
                    `.featured-details[data-id="${this.featuredListings[0].Id}"]`
                );
                if (firstDetail) {
                    firstDetail.classList.add('slds-is-active');
                }
            }
        }
    }
}