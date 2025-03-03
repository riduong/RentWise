public with sharing class AccountController {
    // Get all properties that the current user has saved as favorites
    // @AuraEnabled(cacheable=true) allows this method to be cached for better performance
    @AuraEnabled(cacheable=true)
    public static List<Property__c> getSavedProperties() {
        // Check if the current user is a guest user
        if (UserInfo.getUserType() == 'Guest') {
            // Return empty list for guest users
            return new List<Property__c>();
        }
        
        // Query properties that the current user has saved
        // Uses a subquery to find properties linked to the user through Saved_Property__c
        return [SELECT Id, Name, Primary_Image__c, Price__c, Bedrooms__c, 
                Property_Type__c, Location_Address__c 
                FROM Property__c 
                WHERE Id IN (SELECT Property__c 
                           FROM Saved_Property__c 
                           WHERE User__c = :UserInfo.getUserId())
                ORDER BY Name];
    }
    
    // Toggle a property's favorite status for the current user
    // Not cacheable because it modifies data
    @AuraEnabled
    public static Boolean toggleFavoriteProperty(Id propertyId) {
        // Check if user is guest - throw error if they try to save
        if (UserInfo.getUserType() == 'Guest') {
            throw new AuraHandledException('Please log in to save properties.');
        }

        try {
            // Check if property is already favorited by this user
            List<Saved_Property__c> existingSaved = [
                SELECT Id 
                FROM Saved_Property__c 
                WHERE Property__c = :propertyId 
                AND User__c = :UserInfo.getUserId()
            ];

            // If property is already favorited, remove it
            if (!existingSaved.isEmpty()) {
                delete existingSaved;
                return false; // Indicates property is no longer favorited
            } 
            // If property is not favorited, add it
            else {
                Saved_Property__c newSaved = new Saved_Property__c(
                    Property__c = propertyId,
                    User__c = UserInfo.getUserId()
                );
                insert newSaved;
                return true; // Indicates property is now favorited
            }
        } catch (Exception e) {
            throw new AuraHandledException('Error updating favorite status: ' + e.getMessage());
        }
    }

    // Check if a specific property is favorited by the current user
    // Cacheable for better performance
    @AuraEnabled(cacheable=true)
    public static Boolean isPropertyFavorite(Id propertyId) {
        // Return false for guest users
        if (UserInfo.getUserType() == 'Guest') {
            return false;
        }
        
        // Count how many saved property records exist for this property/user combination
        // Returns true if count > 0 (property is favorited)
        return [SELECT COUNT() 
                FROM Saved_Property__c 
                WHERE Property__c = :propertyId 
                AND User__c = :UserInfo.getUserId()] > 0;
    }
}