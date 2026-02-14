import UserActivity from '../models/UserActivity.js';

class ActivityService {
  /**
   * Log an activity asynchronously (non-blocking)
   * This function returns immediately and logs in the background
   */
  static logActivityAsync(userId, action, actionCategory, data, ipAddress, userAgent) {
    // Fire and forget - don't await
    setImmediate(async () => {
      try {
        await UserActivity.log(userId, action, actionCategory, data, ipAddress, userAgent);
      } catch (error) {
        console.error('Error logging activity:', error);
        // Don't throw - activity logging shouldn't break anything
      }
    });
  }

  /**
   * Log property view
   */
  static logPropertyView(userId, propertyId, ipAddress, userAgent) {
    this.logActivityAsync(
      userId,
      'property_viewed',
      'property',
      { property_id: propertyId },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log property enquiry
   */
  static logPropertyEnquiry(userId, propertyId, enquiryType, ipAddress, userAgent) {
    this.logActivityAsync(
      userId,
      'property_enquiry',
      'property',
      { property_id: propertyId, enquiry_type: enquiryType },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log property interest (save/shortlist)
   */
  static logPropertyInterest(userId, propertyId, interestType, ipAddress, userAgent) {
    this.logActivityAsync(
      userId,
      `property_${interestType}`,
      'property',
      { property_id: propertyId, interest_type: interestType },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log property share
   */
  static logPropertyShare(userId, propertyId, sharedWith, ipAddress, userAgent) {
    this.logActivityAsync(
      userId,
      'property_shared',
      'property',
      { property_id: propertyId, shared_with: sharedWith },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log form submission
   */
  static logFormSubmission(userId, formName, formData, ipAddress, userAgent) {
    this.logActivityAsync(
      userId,
      'form_submitted',
      'form',
      { form_name: formName, fields_submitted: Object.keys(formData) },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log profile update
   */
  static logProfileUpdate(userId, updateType, ipAddress, userAgent) {
    this.logActivityAsync(
      userId,
      'profile_updated',
      'user',
      { update_type: updateType },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log file upload
   */
  static logFileUpload(userId, fileName, fileType, fileSize, ipAddress, userAgent) {
    this.logActivityAsync(
      userId,
      'file_uploaded',
      'file',
      { file_name: fileName, file_type: fileType, file_size: fileSize },
      ipAddress,
      userAgent
    );
  }

  /**
   * Log custom action
   */
  static logCustomAction(userId, action, category, data, ipAddress, userAgent) {
    this.logActivityAsync(userId, action, category, data, ipAddress, userAgent);
  }
}

export default ActivityService;
