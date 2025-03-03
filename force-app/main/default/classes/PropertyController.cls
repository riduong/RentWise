public with sharing class PropertyController {
    // Get all properties without any filters
    // @AuraEnabled(cacheable=true) allows the result to be cached for better performance
    @AuraEnabled(cacheable=true)
    public static List<Property__c> getAllProperties() {
        try {
            // Query all fields needed for property display
            List<Property__c> properties = [
                SELECT Id, Name, Primary_Image__c, Price__c, 
                       Bedrooms__c, Property_Type__c, Location_Address__c, 
                       Other_Features__c, CreatedDate,
                       Description__c, Square_Footage__c, Bathrooms__c, Lot_Size__c 
                FROM Property__c
            ];
            return properties;
        } catch (Exception e) {
            // Wrap any errors in AuraHandledException for proper handling in LWC
            throw new AuraHandledException('Error retrieving properties: ' + e.getMessage());
        }
    }

    // Get a single property by its ID
    // Used in property detail page
    @AuraEnabled(cacheable=true)
    public static Property__c getPropertyById(Id propertyId) {
        try {
            // Query single property with all needed fields
            Property__c property = [
                SELECT Id, Name, Primary_Image__c, Price__c, 
                       Bedrooms__c, Property_Type__c, Location_Address__c, 
                       Other_Features__c, CreatedDate,
                       Description__c, Square_Footage__c, Bathrooms__c, Lot_Size__c 
                FROM Property__c
                WHERE Id = :propertyId
                LIMIT 1
            ];
            return property;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving property: ' + e.getMessage());
        }
    }

    // Get properties based on filter criteria
    // Used in the All Listings page for property filtering
    @AuraEnabled(cacheable=true)
    public static List<Property__c> getFilteredProperties(
        String propertyType,     // Type of property (House, Apartment, etc.)
        Decimal minPrice,        // Minimum price range
        Decimal maxPrice,        // Maximum price range
        String bedrooms,         // Number of bedrooms
        List<String> otherFeatures, // Additional features (Pool, Garage, etc.)
        String sortBy           // Sort order (price_asc, price_desc, date_desc)
    ) {
        try {
            // Build base query with price range filter
            String baseQuery = 'SELECT Id, Name, Primary_Image__c, Price__c, ' +
                             'Bedrooms__c, Property_Type__c, Location_Address__c, ' +
                             'Other_Features__c, CreatedDate ' +
                             'FROM Property__c WHERE Price__c >= :minPrice AND Price__c <= :maxPrice';
            
            // Add property type filter if specified
            if (String.isNotBlank(propertyType) && propertyType != 'none') {
                baseQuery += ' AND Property_Type__c = :propertyType';
            }
            
            // Add bedrooms filter
            if (String.isNotBlank(bedrooms) && bedrooms != 'none') {
                if (bedrooms == '3+') {
                    // Handle 3+ bedrooms case
                    baseQuery += ' AND (Bedrooms__c >= \'3\' OR Bedrooms__c = \'3+\')';
                } else {
                    baseQuery += ' AND Bedrooms__c = :bedrooms';
                }
            }
            
            // Add other features filters
            if (otherFeatures != null && !otherFeatures.isEmpty()) {
                // Add each feature as an INCLUDES clause
                // INCLUDES is used for multi-select picklist fields
                for (String feature : otherFeatures) {
                    baseQuery += ' AND Other_Features__c INCLUDES (\'' + 
                                String.escapeSingleQuotes(feature) + '\')';
                }
            }

            // Add sorting based on sortBy parameter
            if (String.isNotBlank(sortBy)) {
                switch on sortBy {
                    when 'price_asc' {
                        baseQuery += ' ORDER BY Price__c ASC';
                    }
                    when 'price_desc' {
                        baseQuery += ' ORDER BY Price__c DESC';
                    }
                    when 'date_desc' {
                        baseQuery += ' ORDER BY CreatedDate DESC';
                    }
                    when else {
                        baseQuery += ' ORDER BY CreatedDate DESC';
                    }
                }
            }

            // Execute the dynamic query
            return Database.query(baseQuery);
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving filtered properties: ' + 
                                         e.getMessage());
        }
    }

    // Get all images associated with a property
    // Used in property detail page and property cards
    @AuraEnabled(cacheable=true)
    public static List<String> getPropertyImages(Id propertyId) {
        try {
            // Get all attachments using AttachmentHelper
            List<ContentVersion> attachments = AttachmentHelper.getRecordAttachments(propertyId);
            List<String> imageUrls = new List<String>();
            
            // Extract URLs from attachments
            for (ContentVersion cv : attachments) {
                if (cv.VersionDataUrl != null) {
                    imageUrls.add(cv.VersionDataUrl);
                }
            }
            
            return imageUrls;
        } catch (Exception e) {
            throw new AuraHandledException('Error retrieving property images: ' + 
                                         e.getMessage());
        }
    }
}