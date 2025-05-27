document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userType = localStorage.getItem('userType');
    
    if (!token || userType !== 'patient') {
        window.location.href = '../index.html';
        return;
    }
    
    // Get current patient name
    const patientName = localStorage.getItem('userName');
    
    // Load records
    loadRecords();
    
    // Set up filter buttons
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Apply filter
            const filter = this.getAttribute('data-filter');
            filterRecords(filter);
        });
    });
    
    // Set up search
    const searchInput = document.getElementById('search-records');
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        searchRecords(searchTerm);
    });
});

function loadRecords() {
    const recordsList = document.getElementById('records-list');
    const emptyState = document.getElementById('empty-state');
    
    // Get current patient name
    const patientName = localStorage.getItem('userName');
    const patientEmail = localStorage.getItem('userEmail');
    
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Filter records for current patient
    const patientRecords = allMedicalRecords.filter(record => 
        record.patientName === patientName || 
        record.patientEmail === patientEmail
    );
    
    if (patientRecords.length > 0) {
        // Hide empty state
        emptyState.style.display = 'none';
        
        // Clear records list
        recordsList.innerHTML = '';
        
        // Add records
        patientRecords.forEach(record => {
            const recordCard = createRecordCard(record);
            recordsList.appendChild(recordCard);
        });
    } else {
        // Show empty state
        emptyState.style.display = 'block';
        recordsList.innerHTML = '';
    }
}

function createRecordCard(record) {
    const recordCard = document.createElement('div');
    recordCard.className = 'record-card';
    recordCard.setAttribute('data-type', record.recordType || 'medical');
    recordCard.setAttribute('data-id', record.id);
    
    // Format date
    const date = new Date(record.recordDate || record.uploadDate || new Date());
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Determine record type
    const recordType = record.recordType || 'medical';
    
    recordCard.innerHTML = `
        <div class="record-header">
            <h3 class="record-title">${capitalizeFirstLetter(recordType)} Record</h3>
            <span class="record-date">${formattedDate}</span>
        </div>
        <span class="record-type ${recordType.toLowerCase()}">${capitalizeFirstLetter(recordType)}</span>
        <div class="record-details">
            <p><strong>Doctor:</strong> ${record.doctor || 'Not specified'}</p>
            <p><strong>Hospital:</strong> ${record.hospital || 'Not specified'}</p>
            <p><strong>Diagnosis:</strong> ${record.diagnosis || 'Not specified'}</p>
        </div>
        <div class="record-actions">
            <button class="record-btn view-btn" onclick="viewRecord('${record.id}')">
                <i class="fas fa-eye"></i> View
            </button>
            <button class="record-btn download-btn" onclick="downloadRecord('${record.id}')">
                <i class="fas fa-download"></i> Download
            </button>
        </div>
    `;
    
    return recordCard;
}

function filterRecords(filter) {
    const recordCards = document.querySelectorAll('.record-card');
    
    recordCards.forEach(card => {
        if (filter === 'all' || card.getAttribute('data-type').toLowerCase() === filter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show empty state if no records match the filter
    const visibleCards = Array.from(recordCards).filter(card => card.style.display !== 'none');
    const emptyState = document.getElementById('empty-state');
    
    if (visibleCards.length === 0) {
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'No Records Found';
        emptyState.querySelector('p').textContent = `You don't have any ${filter !== 'all' ? filter + ' ' : ''}records.`;
    } else {
        emptyState.style.display = 'none';
    }
}

function searchRecords(searchTerm) {
    const recordCards = document.querySelectorAll('.record-card');
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    
    recordCards.forEach(card => {
        const cardText = card.textContent.toLowerCase();
        const cardType = card.getAttribute('data-type').toLowerCase();
        
        if (cardText.includes(searchTerm) && (activeFilter === 'all' || cardType === activeFilter)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
    
    // Show empty state if no records match the search
    const visibleCards = Array.from(recordCards).filter(card => card.style.display !== 'none');
    const emptyState = document.getElementById('empty-state');
    
    if (visibleCards.length === 0) {
        emptyState.style.display = 'block';
        emptyState.querySelector('h3').textContent = 'No Matching Records';
        emptyState.querySelector('p').textContent = `No records match your search criteria.`;
    } else {
        emptyState.style.display = 'none';
    }
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
        
        modalContent.innerHTML = `
            <span class="close" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
            <h2>${capitalizeFirstLetter(record.recordType || 'Medical')} Record Details</h2>
            <div style="margin-top: 20px;">
                ${detailsHTML}
                ${pdfPreviewHTML}
            </div>
            <div style="margin-top: 20px; text-align: right;">
                <button id="download-btn" style="padding: 8px 16px; background-color: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer;">
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

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make functions available globally
window.viewRecord = viewRecord;
window.downloadRecord = downloadRecord;