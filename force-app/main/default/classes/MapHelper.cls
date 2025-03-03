public with sharing class MapHelper {
    @AuraEnabled
    public static List<Object> getMapMarkers(String address, String propertyName) {
        System.debug('Input Address: ' + address);
        System.debug('Property Name: ' + propertyName);

        if (String.isBlank(address)) {
            return null;
        }

        try {
            // Split the address into parts
            List<String> addressParts = address.split(',');
            
            // Initialize variables
            String street = '';
            String city = '';
            String state = '';
            String postalCode = '';
            
            // Extract address components
            street = addressParts[0].trim(); // Street address
            
            // Add suite if present
            if (addressParts.size() > 2) {
                street += ', ' + addressParts[1].trim();
            }
            
            // Get city, state, zip from last part
            List<String> locationParts = addressParts[addressParts.size()-1].trim().split(' ');
            city = addressParts[addressParts.size()-2].trim(); // City is the second-to-last part
            
            if (locationParts.size() >= 2) {
                state = locationParts[0].trim();
                postalCode = locationParts[1].trim();
            }
            
            System.debug('Parsed components:');
            System.debug('Street: ' + street);
            System.debug('City: ' + city);
            System.debug('State: ' + state);
            System.debug('Postal Code: ' + postalCode);

            // Create the map marker
            Map<String, Object> location = new Map<String, Object>{
                'Street' => street,
                'City' => city,
                'State' => state,
                'PostalCode' => postalCode,
                'Country' => 'USA'
            };
            
            Map<String, Object> marker = new Map<String, Object>{
                'location' => location,
                'title' => propertyName,
                'description' => address,
                'icon' => 'standard:home'
            };
            
            System.debug('Created marker: ' + marker);
            return new List<Object>{ marker };
            
        } catch (Exception e) {
            System.debug('Error parsing address: ' + e.getMessage());
            System.debug('Stack trace: ' + e.getStackTraceString());
            return null;
        }
    }
}