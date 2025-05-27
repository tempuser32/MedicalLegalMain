document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'patient') {
        window.location.href = '../index.html';
        return;
    }
    
    // Get current patient name and email
    const patientName = localStorage.getItem('userName');
    const patientEmail = localStorage.getItem('userEmail');
    
    // Set up tab switching
    setupTabs();
    
    // Load consent requests
    loadConsentRequests();
});

function setupTabs() {
    const tabs = document.querySelectorAll('.consent-tab');
    const tabContents = document.querySelectorAll('.consent-tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab contents
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Show the selected tab content
            const tabId = this.getAttribute('data-tab');
            document.getElementById(`${tabId}-consents`).classList.add('active');
        });
    });
}

function loadConsentRequests() {
    // Get current patient name and email
    const patientName = localStorage.getItem('userName');
    const patientEmail = localStorage.getItem('userEmail');
    
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Filter records for current patient
    const patientRecords = allMedicalRecords.filter(record => 
        record.patientName === patientName || 
        record.patientEmail === patientEmail
    );
    
    // Create consent requests from records
    const pendingRequests = [];
    const activeConsents = [];
    const expiredConsents = [];
    
    patientRecords.forEach(record => {
        // Create a consent request object
        const consentRequest = {
            id: `CONSENT-${record.id}`,
            recordId: record.id,
            requestDate: record.uploadDate || new Date().toISOString(),
            requesterName: record.uploadedBy || 'Medical Staff',
            requesterType: 'Medical',
            recordType: record.recordType || 'medical',
            hospital: record.hospital || 'Unknown Hospital',
            status: record.consentStatus || 'pending',
            expiryDate: record.consentExpiryDate,
            record: record
        };
        
        // Add to appropriate list based on status
        if (consentRequest.status === 'approved') {
            activeConsents.push(consentRequest);
        } else if (consentRequest.status === 'rejected') {
            expiredConsents.push(consentRequest);
        } else {
            pendingRequests.push(consentRequest);
        }
    });
    
    // Display the consent requests
    displayConsentRequests('active', activeConsents);
    displayConsentRequests('pending', pendingRequests);
    displayConsentRequests('expired', expiredConsents);
}

function displayConsentRequests(type, requests) {
    const listElement = document.getElementById(`${type}-consent-list`);
    const emptyState = document.getElementById(`${type}-empty-state`);
    
    if (requests.length > 0) {
        // Hide empty state
        emptyState.style.display = 'none';
        
        // Clear list
        listElement.innerHTML = '';
        
        // Add requests
        requests.forEach(request => {
            const requestCard = createConsentCard(request, type);
            listElement.appendChild(requestCard);
        });
    } else {
        // Show empty state
        emptyState.style.display = 'block';
        listElement.innerHTML = '';
    }
}

function createConsentCard(consent, type) {
    const card = document.createElement('div');
    card.className = 'consent-card';
    card.setAttribute('data-id', consent.id);
    
    // Format date
    const requestDate = new Date(consent.requestDate);
    const formattedDate = requestDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Determine status class
    let statusClass = 'pending';
    let statusText = 'Pending';
    
    if (consent.status === 'approved') {
        statusClass = 'active';
        statusText = 'Approved';
    } else if (consent.status === 'rejected') {
        statusClass = 'expired';
        statusText = 'Rejected';
    }
    
    // Create card content based on type
    let actionsHTML = '';
    
    if (type === 'pending') {
        actionsHTML = `
            <div class="consent-actions">
                <button class="consent-btn view-btn" onclick="viewRecord('${consent.recordId}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="consent-btn approve-btn" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3);" onclick="approveConsent('${consent.id}')">
                    <i class="fas fa-check"></i> Approve
                </button>
                <button class="consent-btn revoke-btn" onclick="rejectConsent('${consent.id}')">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        `;
    } else if (type === 'active') {
        actionsHTML = `
            <div class="consent-actions">
                <button class="consent-btn view-btn" onclick="viewRecord('${consent.recordId}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="consent-btn revoke-btn" onclick="revokeConsent('${consent.id}')">
                    <i class="fas fa-ban"></i> Revoke
                </button>
            </div>
        `;
    } else {
        actionsHTML = `
            <div class="consent-actions">
                <button class="consent-btn view-btn" onclick="viewRecord('${consent.recordId}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="consent-header">
            <h3 class="consent-title">${capitalizeFirstLetter(consent.recordType)} Record</h3>
            <span class="consent-date">${formattedDate}</span>
        </div>
        <span class="consent-status ${statusClass}">${statusText}</span>
        <div class="consent-details">
            <p><strong>Requester:</strong> ${consent.requesterName}</p>
            <p><strong>Hospital:</strong> ${consent.hospital}</p>
            <p><strong>Record Type:</strong> ${capitalizeFirstLetter(consent.recordType)}</p>
        </div>
        ${actionsHTML}
    `;
    
    return card;
}

function viewRecord(recordId) {
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const record = allMedicalRecords.find(r => r.id === recordId);
    
    if (record) {
        // Create modal for detailed view
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.style.position = 'fixed';
        modal.style.zIndex = '1000';
        modal.style.left = '0';
        modal.style.top = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.overflow = 'auto';
        modal.style.backgroundColor = 'rgba(0,0,0,0.7)';
        
        // Format date
        const date = new Date(record.recordDate || record.uploadDate || new Date());
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.backgroundColor = '#1e293b';
        modalContent.style.margin = '5% auto';
        modalContent.style.padding = '20px';
        modalContent.style.border = '1px solid rgba(148, 163, 184, 0.2)';
        modalContent.style.borderRadius = '15px';
        modalContent.style.width = '70%';
        modalContent.style.color = 'white';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';
        
        // Build HTML content based on available fields
        let detailsHTML = `
            <p><strong>Record ID:</strong> ${record.id}</p>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Doctor:</strong> ${record.doctor || 'Not specified'}</p>
            <p><strong>Hospital:</strong> ${record.hospital || 'Not specified'}</p>
        `;
        
        // Add patient details if available
        if (record.patientId || record.dateOfBirth || record.gender || record.contactNumber) {
            detailsHTML += `
                <h3 style="margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Patient Information</h3>
                ${record.patientId ? `<p><strong>Patient ID:</strong> ${record.patientId}</p>` : ''}
                ${record.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${record.dateOfBirth}</p>` : ''}
                ${record.gender ? `<p><strong>Gender:</strong> ${capitalizeFirstLetter(record.gender)}</p>` : ''}
                ${record.contactNumber ? `<p><strong>Contact:</strong> ${record.contactNumber}</p>` : ''}
                ${record.address ? `<p><strong>Address:</strong> ${record.address}</p>` : ''}
            `;
        }
        
        // Add medical details if available
        detailsHTML += `
            <h3 style="margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Medical Information</h3>
            ${record.diagnosis ? `<p><strong>Diagnosis:</strong> ${record.diagnosis}</p>` : ''}
            ${record.treatmentProvided ? `<p><strong>Treatment:</strong> ${record.treatmentProvided}</p>` : ''}
            ${record.caseType ? `<p><strong>Case Type:</strong> ${record.caseType}</p>` : ''}
            ${record.caseNumber ? `<p><strong>Case Number:</strong> ${record.caseNumber}</p>` : ''}
            ${record.caseDescription ? `<p><strong>Case Description:</strong> ${record.caseDescription}</p>` : ''}
            ${record.content ? `<p><strong>Additional Notes:</strong> ${record.content}</p>` : ''}
        `;
        
        // Add dates if available
        if (record.admissionDate || record.dischargeDate || record.incidentDate) {
            detailsHTML += `
                <h3 style="margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Important Dates</h3>
                ${record.admissionDate ? `<p><strong>Admission Date:</strong> ${record.admissionDate}</p>` : ''}
                ${record.dischargeDate ? `<p><strong>Discharge Date:</strong> ${record.dischargeDate}</p>` : ''}
                ${record.incidentDate ? `<p><strong>Incident Date:</strong> ${record.incidentDate}</p>` : ''}
            `;
        }
        
        // Add file information
        detailsHTML += `
            <h3 style="margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">File Information</h3>
            <p><strong>File Name:</strong> ${record.fileName || 'No file attached'}</p>
            <p><strong>Uploaded By:</strong> ${record.uploadedBy || 'Unknown'}</p>
            <p><strong>Upload Date:</strong> ${new Date(record.uploadDate).toLocaleString()}</p>
        `;
        
        // Add PDF preview if available
        let pdfPreviewHTML = '';
        if (record.fileData && record.fileData.startsWith('data:application/pdf')) {
            pdfPreviewHTML = `
                <h3 style="margin-top: 20px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 10px;">Document Preview</h3>
                <div style="background-color: #f0f0f0; padding: 10px; border-radius: 5px; text-align: center;">
                    <iframe src="${record.fileData}" width="100%" height="500px" style="border: none;"></iframe>
                </div>
            `;
        }
        
        // Get consent status
        const consentId = `CONSENT-${record.id}`;
        let consentStatus = record.consentStatus || 'pending';
        let consentButtonsHTML = '';
        
        if (consentStatus === 'pending') {
            consentButtonsHTML = `
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="approve-btn" style="padding: 8px 16px; background-color: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-check"></i> Approve Consent
                    </button>
                    <button id="reject-btn" style="padding: 8px 16px; background-color: #ef4444; color: white; border: none; border-radius: 5px; cursor: pointer;">
                        <i class="fas fa-times"></i> Reject Consent
                    </button>
                </div>
            `;
        }
        
        modalContent.innerHTML = `
            <span class="close" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
            <h2>${capitalizeFirstLetter(record.recordType || 'Medical')} Record Details</h2>
            <div style="margin-top: 20px;">
                ${detailsHTML}
                ${pdfPreviewHTML}
            </div>
            ${consentButtonsHTML}
            <div style="margin-top: 20px; text-align: right;">
                <button id="download-btn" style="padding: 8px 16px; background-color: #4f46e5; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-download"></i> Download File
                </button>
            </div>
        `;
        
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        // Close modal when clicking on X
        const closeBtn = modal.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });
        
        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });
        
        // Add download functionality
        const downloadBtn = modal.querySelector('#download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                downloadRecord(recordId);
            });
        }
        
        // Add consent buttons functionality
        const approveBtn = modal.querySelector('#approve-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                approveConsent(consentId);
                document.body.removeChild(modal);
            });
        }
        
        const rejectBtn = modal.querySelector('#reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                rejectConsent(consentId);
                document.body.removeChild(modal);
            });
        }
    } else {
        alert('Record not found');
    }
}

function downloadRecord(recordId) {
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const record = allMedicalRecords.find(r => r.id === recordId);
    
    if (record) {
        if (record.fileData && record.fileData.startsWith('data:')) {
            // Create a download link for the base64 data
            const a = document.createElement('a');
            a.href = record.fileData;
            a.download = record.fileName || `${record.recordType || 'medical'}_record.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } else {
            // Create a text file with record details as fallback
            const recordDetails = `
Medical Record: ${record.id}
Patient: ${record.patientName}
Patient ID: ${record.patientId || 'N/A'}
Date: ${new Date(record.recordDate || record.uploadDate).toLocaleDateString()}
Doctor: ${record.doctor || 'Not specified'}
Hospital: ${record.hospital || 'Not specified'}
Diagnosis: ${record.diagnosis || 'Not specified'}
Treatment: ${record.treatmentProvided || 'Not specified'}
Case Type: ${record.caseType || 'Not specified'}
Case Description: ${record.caseDescription || 'Not specified'}
            `;
            
            // Create a Blob with the content
            const blob = new Blob([recordDetails], { type: 'text/plain' });
            
            // Create a download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = record.fileName || `${record.recordType || 'medical'}_record_${record.id}.txt`;
            
            // Append to body, click and remove
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            // Release the object URL
            URL.revokeObjectURL(url);
        }
    } else {
        alert('Record not found');
    }
}

function approveConsent(consentId) {
    const recordId = consentId.replace('CONSENT-', '');
    
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const recordIndex = allMedicalRecords.findIndex(r => r.id === recordId);
    
    if (recordIndex !== -1) {
        // Update consent status
        allMedicalRecords[recordIndex].consentStatus = 'approved';
        allMedicalRecords[recordIndex].consentDate = new Date().toISOString();
        allMedicalRecords[recordIndex].consentExpiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 180 days
        
        // Save back to localStorage
        localStorage.setItem('medicalRecords', JSON.stringify(allMedicalRecords));
        
        // Add notification
        addNotification({
            id: `NOTIF-${Date.now()}`,
            type: 'consent',
            title: 'Consent Approved',
            message: `You have approved access to your ${allMedicalRecords[recordIndex].recordType || 'medical'} record.`,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Reload consent requests
        loadConsentRequests();
        
        // Show success message
        alert('Consent approved successfully');
    } else {
        alert('Record not found');
    }
}

function rejectConsent(consentId) {
    const recordId = consentId.replace('CONSENT-', '');
    
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const recordIndex = allMedicalRecords.findIndex(r => r.id === recordId);
    
    if (recordIndex !== -1) {
        // Update consent status
        allMedicalRecords[recordIndex].consentStatus = 'rejected';
        allMedicalRecords[recordIndex].consentDate = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('medicalRecords', JSON.stringify(allMedicalRecords));
        
        // Add notification
        addNotification({
            id: `NOTIF-${Date.now()}`,
            type: 'consent',
            title: 'Consent Rejected',
            message: `You have rejected access to your ${allMedicalRecords[recordIndex].recordType || 'medical'} record.`,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Reload consent requests
        loadConsentRequests();
        
        // Show success message
        alert('Consent rejected successfully');
    } else {
        alert('Record not found');
    }
}

function revokeConsent(consentId) {
    const recordId = consentId.replace('CONSENT-', '');
    
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const recordIndex = allMedicalRecords.findIndex(r => r.id === recordId);
    
    if (recordIndex !== -1) {
        // Update consent status
        allMedicalRecords[recordIndex].consentStatus = 'rejected';
        allMedicalRecords[recordIndex].consentDate = new Date().toISOString();
        
        // Save back to localStorage
        localStorage.setItem('medicalRecords', JSON.stringify(allMedicalRecords));
        
        // Add notification
        addNotification({
            id: `NOTIF-${Date.now()}`,
            type: 'consent',
            title: 'Consent Revoked',
            message: `You have revoked access to your ${allMedicalRecords[recordIndex].recordType || 'medical'} record.`,
            timestamp: new Date().toISOString(),
            read: false
        });
        
        // Reload consent requests
        loadConsentRequests();
        
        // Show success message
        alert('Consent revoked successfully');
    } else {
        alert('Record not found');
    }
}

function addNotification(notification) {
    const notifications = JSON.parse(localStorage.getItem('patientNotifications') || '[]');
    notifications.unshift(notification);
    
    // Keep only the 20 most recent notifications
    const recentNotifications = notifications.slice(0, 20);
    
    // Save back to localStorage
    localStorage.setItem('patientNotifications', JSON.stringify(recentNotifications));
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make functions available globally
window.viewRecord = viewRecord;
window.downloadRecord = downloadRecord;
window.approveConsent = approveConsent;
window.rejectConsent = rejectConsent;
window.revokeConsent = revokeConsent;