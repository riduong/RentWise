trigger SavedPropertyTrigger on Saved_Property__c (before insert, before update) {
    for (Saved_Property__c sp : Trigger.new) {
        User u = [SELECT UserType FROM User WHERE Id = :sp.User__c LIMIT 1];
        if (u.UserType == 'Guest') {
            sp.addError('Guest users cannot save properties.');
        }
    }
}