import { LightningElement, api, wire } from 'lwc';
import getPropertyImages from '@salesforce/apex/PropertyController.getPropertyImages';

const FALLBACK_IMAGE = '/assets/images/property-placeholder.jpg';

export default class PropertyImage extends LightningElement {
    @api propertyId;
    @api showAllImages = false;
    imageUrls = [];
    isLoading = true;
    selectedImageIndex = 0;

    @wire(getPropertyImages, { propertyId: '$propertyId' })
    wiredImages({ error, data }) {
        this.isLoading = true;
        if (data) {
            this.imageUrls = data;
            this.isLoading = false;
        } else if (error) {
            console.error('Error loading images:', error);
            this.imageUrls = [FALLBACK_IMAGE];
            this.isLoading = false;
        }
    }

    get mainImageUrl() {
        return this.imageUrls.length > 0 ? this.imageUrls[this.selectedImageIndex] : FALLBACK_IMAGE;
    }

    get hasMultipleImages() {
        return this.imageUrls.length > 1;
    }

    handlePreviousImage() {
        if (this.selectedImageIndex > 0) {
            this.selectedImageIndex--;
        }
    }

    handleNextImage() {
        if (this.selectedImageIndex < this.imageUrls.length - 1) {
            this.selectedImageIndex++;
        }
    }

    handleImageError() {
        const img = this.template.querySelector('img');
        if (img) {
            img.src = FALLBACK_IMAGE;
        }
    }
}