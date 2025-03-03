public with sharing class HomePageController {
    @AuraEnabled(cacheable=true)
    public static List<Property__c> getFeaturedListings() {
        return [SELECT Id, Name, Primary_Image__c, Days_Rented__c
                FROM Property__c
                WHERE Days_Rented__c > 0
                ORDER BY Days_Rented__c DESC
                LIMIT 5];
    }
    
    @AuraEnabled(cacheable=true)
    public static List<Property__c> searchProperties(String searchAddress) {
        String searchKey = '%' + searchAddress + '%';
        return [SELECT Id, Name, Primary_Image__c, Price__c, Bedrooms__c, 
                Property_Type__c, Location_Address__c
                FROM Property__c
                WHERE Location_Address__c LIKE :searchKey
                ORDER BY Location_Address__c ASC
                LIMIT 10];
    }
}