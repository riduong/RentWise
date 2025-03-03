public without sharing class ContactAgentController {
    public class ContactRequest {
        @AuraEnabled public String firstName { get; set; }
        @AuraEnabled public String lastName { get; set; }
        @AuraEnabled public String email { get; set; }
        @AuraEnabled public String message { get; set; }
        @AuraEnabled public String propertyId { get; set; }
    }

    @AuraEnabled
    public static Boolean submitContactRequest(ContactRequest request) {
        try {
            Lead newLead = new Lead();
            newLead.FirstName = request.firstName;
            newLead.LastName = request.lastName;
            newLead.Email = request.email;
            newLead.Description = request.message;
            newLead.Company = (String.isNotBlank(request.firstName) ? 
                             request.firstName + ' ' : '') + request.lastName;
            newLead.LeadSource = 'Property Website';
            
            insert newLead;
            return true;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}