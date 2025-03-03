import { LightningElement, track } from 'lwc';
import getFilteredProperties from '@salesforce/apex/PropertyController.getFilteredProperties';

const ITEMS_PER_PAGE = 9; // Number of properties shown per page

export default class AllListingPage extends LightningElement {
    // Price range constants
    minPriceValue = 500;
    maxPriceValue = 10000000;
    stepValue = 1000;

    // Tracked properties for reactive updates
    @track properties = [];         // All properties
    @track displayedProperties = []; // Properties shown on current page
    @track isLoading = false;       // Loading state
    @track errorMessage = '';       // Error messages
    @track isFiltersExpanded = false; // Mobile filters panel state
    @track totalProperties = 0;     // Total number of properties
    @track currentPage = 1;         // Current page number
    @track totalPages = 1;          // Total number of pages

    // Filter state object
    @track filters = {
        propertyType: 'none',
        minPrice: 500,
        maxPrice: 10000000,
        bedrooms: 'none',
        otherFeatures: [],
        sortBy: 'date_desc'
    };

    // Dropdown options for filters
    propertyTypeOptions = [
        { label: 'Any', value: 'none' },
        { label: 'House', value: 'House' },
        { label: 'Apartment', value: 'Apartment' },
        { label: 'Condo', value: 'Condo' }
    ];

    bedroomOptions = [
        { label: 'Any', value: 'none' },
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3+', value: '3+' }
    ];

    sortOptions = [
        { label: 'Newest First', value: 'date_desc' },
        { label: 'Price: Low to High', value: 'price_asc' },
        { label: 'Price: High to Low', value: 'price_desc' }
    ];

    // Property features that can be filtered
    otherFeatureOptions = [
        { label: 'Pet-Friendly', value: 'Pet-Friendly' },
        { label: 'Pool', value: 'Pool' },
        { label: 'Garage', value: 'Garage' },
        // ... other features ...
    ];

    // Lifecycle hook - called when component is inserted into DOM
    connectedCallback() {
        this.fetchFilteredProperties();
        // Bind escape key handler for mobile filters
        this.handleKeyDown = this.handleKeyDown.bind(this);
        window.addEventListener('keydown', this.handleKeyDown);
    }

    // Cleanup when component is removed
    disconnectedCallback() {
        window.removeEventListener('keydown', this.handleKeyDown);
    }

    // Close mobile filters panel with escape key
    handleKeyDown(event) {
        if (event.key === 'Escape' && this.isFiltersExpanded) {
            this.toggleFilters();
        }
    }

    // Price filter handlers
    handleMinPriceChange(event) {
        let newMinPrice = parseInt(event.target.value);
        // Ensure min price doesn't exceed max price
        if (newMinPrice > this.filters.maxPrice) {
            newMinPrice = this.filters.maxPrice;
        }
        this.filters.minPrice = newMinPrice;
        this.fetchFilteredProperties();
    }

    handleMaxPriceChange(event) {
        let newMaxPrice = parseInt(event.target.value);
        // Ensure max price isn't less than min price
        if (newMaxPrice < this.filters.minPrice) {
            newMaxPrice = this.filters.minPrice;
        }
        this.filters.maxPrice = newMaxPrice;
        this.fetchFilteredProperties();
    }

    // Sort order handler
    handleSortChange(event) {
        this.filters.sortBy = event.detail.value;
        this.fetchFilteredProperties();
    }

    // Generic filter change handler
    handleFilterChange(event) {
        const field = event.target.dataset.field;
        const value = event.detail.value;

        // Handle multi-select features differently
        if (field === 'otherFeatures') {
            this.filters.otherFeatures = Array.isArray(value) ? value : [value];
        } else {
            this.filters[field] = value;
        }
        
        this.fetchFilteredProperties();
    }

    // Favorite property handler
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

    // Main method to fetch properties based on filters
    async fetchFilteredProperties() {
        this.isLoading = true;
        this.errorMessage = '';

        try {
            // Get filtered properties from server
            const result = await getFilteredProperties({
                propertyType: this.filters.propertyType,
                minPrice: this.filters.minPrice,
                maxPrice: this.filters.maxPrice,
                bedrooms: this.filters.bedrooms,
                otherFeatures: this.filters.otherFeatures,
                sortBy: this.filters.sortBy
            });
            
            // Process results and update pagination
            this.properties = this.formatProperties(result);
            this.totalProperties = this.properties.length;
            this.totalPages = Math.ceil(this.totalProperties / ITEMS_PER_PAGE);
            this.updateDisplayedProperties();
            
        } catch (error) {
            console.error('Error fetching properties:', error);
            this.errorMessage = 'Error loading properties: ' + 
                (error.body?.message || error.message || 'Unknown error');
            this.showErrorToast();
        } finally {
            this.isLoading = false;
        }
    }

    // Format property data for display
    formatProperties(data) {
        return data.map(property => ({
            ...property,
            formattedFeatures: property.Other_Features__c ? 
                property.Other_Features__c.split(';').join(', ') : '',
            Primary_Image__c: property.Primary_Image__c || '/resource/DefaultPropertyImage'
        }));
    }

    // Update which properties are shown based on current page
    updateDisplayedProperties() {
        const startIndex = (this.currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        this.displayedProperties = this.properties.slice(startIndex, endIndex);
    }

    // Handle page changes in pagination
    handlePageChange(event) {
        const page = parseInt(event.target.dataset.page);
        if (page !== this.currentPage && page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.updateDisplayedProperties();
        }
    }

    // Toggle mobile filters panel
    toggleFilters() {
        this.isFiltersExpanded = !this.isFiltersExpanded;
        if (this.isFiltersExpanded) {
            // Add overlay when filters are shown on mobile
            const overlay = document.createElement('div');
            overlay.className = 'filters-overlay visible';
            overlay.onclick = () => this.toggleFilters();
            document.body.appendChild(overlay);
        } else {
            // Remove overlay when filters are hidden
            const overlay = document.querySelector('.filters-overlay');
            if (overlay) {
                overlay.remove();
            }
        }
    }

    // Various getters for computed properties
    get filterButtonClass() {
        return `filter-toggle-button slds-button slds-button_neutral ${
            this.isFiltersExpanded ? 'hidden' : ''
        }`;
    }

    get filtersPanelClass() {
        return `filters-panel ${this.isFiltersExpanded ? 'expanded' : ''}`;
    }

    get mainContentClass() {
        return `main-content-area ${this.isFiltersExpanded ? 'expanded' : ''}`;
    }

    // Formatting getters
    get formattedMinPrice() {
        return this.filters.minPrice.toLocaleString();
    }

    get formattedMaxPrice() {
        return this.filters.maxPrice.toLocaleString();
    }

    // Pagination buttons getter
    get paginationButtons() {
        const buttons = [];
        
        if (this.totalPages > 1) {
            // Add Previous button
            buttons.push({
                label: 'Previous',
                value: this.currentPage - 1,
                disabled: this.currentPage === 1,
                isPrev: true
            });

            // Add number buttons
            for (let i = 1; i <= this.totalPages; i++) {
                buttons.push({
                    label: i.toString(),
                    value: i,
                    active: i === this.currentPage,
                    isNumber: true
                });
            }

            // Add Next button
            buttons.push({
                label: 'Next',
                value: this.currentPage + 1,
                disabled: this.currentPage === this.totalPages,
                isNext: true
            });
        } else {
            // If only one page, just show page 1
            buttons.push({
                label: '1',
                value: 1,
                active: true,
                isNumber: true
            });
        }

        return buttons;
    }

    // Status text getters
    get propertyCountText() {
        return `${this.totalProperties} Properties Found`;
    }

    get hasProperties() {
        return this.displayedProperties.length > 0;
    }
}