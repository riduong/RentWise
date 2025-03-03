public without sharing class AttachmentHelper {
    @AuraEnabled(cacheable=true)
    public static List<ContentVersion> getRecordAttachments(String recordId){
        try {
            List<ContentDocumentLink> cdlList = [
                SELECT Id, ContentDocument.LatestPublishedVersionId 
                FROM ContentDocumentLink 
                WHERE LinkedEntityId = :recordId
            ];
            
            Set<String> cdlIdList = new Set<String>();
            for(ContentDocumentLink cdl : cdlList) {
                cdlIdList.add(cdl.ContentDocument.LatestPublishedVersionId);
            }
            
            Set<String> fileTypes = new Set<String>{'jpg', 'png', 'jpeg', 'gif'};
            return [
                SELECT Id, Title, VersionDataUrl, FileType 
                FROM ContentVersion 
                WHERE Id IN :cdlIdList 
                AND FileType IN :fileTypes
                ORDER BY CreatedDate DESC
            ];
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}