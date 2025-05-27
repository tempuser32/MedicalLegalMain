document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
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
    
    // Get all access requests
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Filter requests for current patient
    const patientRequests = accessRequests.filter(request => 
        request.patientName === patientName || 
        request.patientEmail === patientEmail
    );
    
    // Create consent requests from records
    const pendingRequests = [];
    const activeConsents = [];
    const rejectedConsents = [];
    
    patientRequests.forEach(request => {
        if (request.status === 'approved' && request.patientConsent === true) {
            activeConsents.push(request);
        } else if (request.status === 'rejected' || request.patientConsent === false) {
            rejectedConsents.push(request);
        } else {
            pendingRequests.push(request);
        }
    });
    
    // Display the consent requests
    displayConsentRequests('active', activeConsents);
    displayConsentRequests('pending', pendingRequests);
    displayConsentRequests('rejected', rejectedConsents);
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
    const requestDate = new Date(consent.requestDate || consent.createdAt || new Date());
    const formattedDate = requestDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Determine status class
    let statusClass = 'pending';
    let statusText = 'Pending';
    
    if (type === 'active') {
        statusClass = 'active';
        statusText = 'Approved';
    } else if (type === 'rejected') {
        statusClass = 'expired';
        statusText = 'Rejected';
    }
    
    // Create card content based on type
    let actionsHTML = '';
    
    if (type === 'pending') {
        actionsHTML = `
            <div class="consent-actions">
                <button class="consent-btn view-btn" onclick="viewRequest('${consent.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                <button class="consent-btn approve-btn" onclick="approveConsent('${consent.id}')">
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
                <button class="consent-btn view-btn" onclick="viewRequest('${consent.id}')">
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
                <button class="consent-btn view-btn" onclick="viewRequest('${consent.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
            </div>
        `;
    }
    
    card.innerHTML = `
        <div class="consent-header">
            <h3 class="consent-title">Legal Access Request</h3>
            <span class="consent-date">${formattedDate}</span>
        </div>
        <span class="consent-status ${statusClass}">${statusText}</span>
        <div class="consent-details">
            <p><strong>Requester:</strong> ${consent.legalProfessionalName || 'Legal Professional'}</p>
            <p><strong>Case ID:</strong> ${consent.caseId || 'Not specified'}</p>
            <p><strong>Case Type:</strong> ${capitalizeFirstLetter(consent.caseType || 'Legal')}</p>
            <p><strong>Hospital:</strong> ${consent.hospital || 'Not specified'}</p>
        </div>
        ${actionsHTML}
    `;
    
    return card;
}

function viewRequest(requestId) {
    // Get all access requests
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the specific request
    const request = accessRequests.find(r => r.id === requestId);
    
    if (request) {
        // Create modal for detailed view
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        // Format date
        const requestDate = new Date(request.requestDate || request.createdAt || new Date());
        const formattedDate = requestDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        // Determine status
        let statusClass = 'pending';
        let statusText = 'Pending';
        
        if (request.status === 'approved' && request.patientConsent === true) {
            statusClass = 'active';
            statusText = 'Approved';
        } else if (request.status === 'rejected' || request.patientConsent === false) {
            statusClass = 'expired';
            statusText = 'Rejected';
        }
        
        // Create consent buttons based on status
        let consentButtonsHTML = '';
        if (request.patientConsent !== true && request.patientConsent !== false) {
            consentButtonsHTML = `
                <div style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="approve-btn" class="consent-btn approve-btn">
                        <i class="fas fa-check"></i> Approve Consent
                    </button>
                    <button id="reject-btn" class="consent-btn revoke-btn">
                        <i class="fas fa-times"></i> Reject Consent
                    </button>
                </div>
            `;
        }
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Legal Access Request Details</h2>
                <div class="record-details">
                    <p><strong>Request ID:</strong> ${request.id}</p>
                    <p><strong>Date Requested:</strong> ${formattedDate}</p>
                    <p><strong>Status:</strong> <span class="consent-status ${statusClass}">${statusText}</span></p>
                    
                    <h3>Legal Professional Information</h3>
                    <p><strong>Name:</strong> ${request.legalProfessionalName || 'Not specified'}</p>
                    <p><strong>Email:</strong> ${request.legalProfessionalEmail || 'Not specified'}</p>
                    <p><strong>Organization:</strong> ${request.organization || 'Not specified'}</p>
                    
                    <h3>Case Information</h3>
                    <p><strong>Case ID:</strong> ${request.caseId || 'Not specified'}</p>
                    <p><strong>Case Type:</strong> ${capitalizeFirstLetter(request.caseType || 'Legal')}</p>
                    <p><strong>Hospital:</strong> ${request.hospital || 'Not specified'}</p>
                    <p><strong>Date Range:</strong> ${request.startDate || 'Not specified'} to ${request.endDate || 'Not specified'}</p>
                    
                    <h3>Request Reason</h3>
                    <div class="record-content">
                        ${request.reason || 'No reason provided'}
                    </div>
                </div>
                ${consentButtonsHTML}
            </div>
        `;
        
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
        
        // Add consent buttons functionality
        const approveBtn = modal.querySelector('#approve-btn');
        if (approveBtn) {
            approveBtn.addEventListener('click', () => {
                approveConsent(requestId);
                document.body.removeChild(modal);
            });
        }
        
        const rejectBtn = modal.querySelector('#reject-btn');
        if (rejectBtn) {
            rejectBtn.addEventListener('click', () => {
                rejectConsent(requestId);
                document.body.removeChild(modal);
            });
        }
    } else {
        alert('Request not found');
    }
}

function approveConsent(requestId) {
    // Get all access requests
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the specific request
    const requestIndex = accessRequests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
        // Update consent status
        accessRequests[requestIndex].patientConsent = true;
        accessRequests[requestIndex].patientConsentDate = new Date().toISOString();
        
        // If medical approval is also granted, update the overall status
        if (accessRequests[requestIndex].medicalApproval === true) {
            accessRequests[requestIndex].status = 'approved';
        }
        
        // Save back to localStorage
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Reload consent requests
        loadConsentRequests();
        
        // Show success message
        alert('Consent approved successfully');
    } else {
        alert('Request not found');
    }
}

function rejectConsent(requestId) {
    // Get all access requests
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the specific request
    const requestIndex = accessRequests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
        // Update consent status
        accessRequests[requestIndex].patientConsent = false;
        accessRequests[requestIndex].patientConsentDate = new Date().toISOString();
        accessRequests[requestIndex].status = 'rejected';
        
        // Save back to localStorage
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Reload consent requests
        loadConsentRequests();
        
        // Show success message
        alert('Consent rejected successfully');
    } else {
        alert('Request not found');
    }
}

function revokeConsent(requestId) {
    // Get all access requests
    const accessRequests = JSON.parse(localStorage.getItem('accessRequests') || '[]');
    
    // Find the specific request
    const requestIndex = accessRequests.findIndex(r => r.id === requestId);
    
    if (requestIndex !== -1) {
        // Update consent status
        accessRequests[requestIndex].patientConsent = false;
        accessRequests[requestIndex].patientConsentDate = new Date().toISOString();
        accessRequests[requestIndex].status = 'rejected';
        
        // Save back to localStorage
        localStorage.setItem('accessRequests', JSON.stringify(accessRequests));
        
        // Reload consent requests
        loadConsentRequests();
        
        // Show success message
        alert('Consent revoked successfully');
    } else {
        alert('Request not found');
    }
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make functions available globally
window.viewRequest = viewRequest;
window.approveConsent = approveConsent;
window.rejectConsent = rejectConsent;
window.revokeConsent = revokeConsent;