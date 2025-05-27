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
    
    // Generate sample records if none exist
    generateSampleRecords();
    
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
    
    // Add to recent activities
    addActivity({
        id: `ACT-${Date.now()}`,
        type: 'record',
        title: 'Records Viewed',
        description: 'You viewed your medical records',
        timestamp: new Date().toISOString(),
        patientName: patientName
    });
});

function generateSampleRecords() {
    // Check if records already exist
    const existingRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    if (existingRecords.length > 0) return;
    
    const patientName = localStorage.getItem('userName') || 'Patient';
    const patientEmail = localStorage.getItem('userEmail') || 'patient@example.com';
    
    const sampleRecords = [
        {
            id: 'REC-001',
            patientName: patientName,
            patientEmail: patientEmail,
            recordType: 'medical',
            recordDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
            doctor: 'Dr. Sarah Johnson',
            hospital: 'City Medical Center',
            content: 'Annual physical examination. Blood pressure: 120/80. Heart rate: 72 bpm. All vitals normal.',
            diagnosis: 'Healthy, no significant findings',
            treatment: 'No treatment required',
            notes: 'Patient should continue regular exercise and balanced diet',
            fileUrl: '/backend/uploads/medical/0a9c0331-bf72-4d9c-a813-5f4b4bcdaf30.pdf',
            fileName: 'annual_physical_report.pdf',
            uploadedBy: 'Dr. Sarah Johnson'
        },
        {
            id: 'REC-002',
            patientName: patientName,
            patientEmail: patientEmail,
            recordType: 'lab',
            recordDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
            doctor: 'Dr. Michael Chen',
            hospital: 'City Medical Center',
            content: 'Complete blood count (CBC) results. White blood cell count: 7.5. Red blood cell count: 4.8. All values within normal range.',
            diagnosis: 'Normal blood work',
            treatment: 'No treatment required',
            notes: 'Follow-up in 6 months for routine check',
            fileUrl: '/backend/uploads/medical/17672433-5c0c-46c3-8b7d-eb9297caccdf.pdf',
            fileName: 'blood_work_results.pdf',
            uploadedBy: 'Lab Technician John Davis'
        },
        {
            id: 'REC-003',
            patientName: patientName,
            patientEmail: patientEmail,
            recordType: 'prescription',
            recordDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
            doctor: 'Dr. Sarah Johnson',
            hospital: 'City Medical Center',
            content: 'Prescription for seasonal allergies. Loratadine 10mg, once daily for 30 days.',
            diagnosis: 'Seasonal allergic rhinitis',
            treatment: 'Loratadine 10mg daily',
            notes: 'Avoid known allergens. Return if symptoms worsen.',
            fileUrl: '/backend/uploads/medical/a52f48d4-4490-4cf9-9629-7ec854943582.pdf',
            fileName: 'allergy_prescription.pdf',
            uploadedBy: 'Dr. Sarah Johnson'
        }
    ];
    
    localStorage.setItem('medicalRecords', JSON.stringify(sampleRecords));
}

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
            <p>${record.content || 'No description available'}</p>
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
        modalContent.style.margin = '10% auto';
        modalContent.style.padding = '20px';
        modalContent.style.border = '1px solid rgba(148, 163, 184, 0.2)';
        modalContent.style.borderRadius = '15px';
        modalContent.style.width = '70%';
        modalContent.style.color = 'white';
        
        modalContent.innerHTML = `
            <span class="close" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
            <h2>${capitalizeFirstLetter(record.recordType || 'Medical')} Record Details</h2>
            <div style="margin-top: 20px;">
                <p><strong>Record ID:</strong> ${record.id}</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Doctor:</strong> ${record.doctor || 'Not specified'}</p>
                <p><strong>Hospital:</strong> ${record.hospital || 'Not specified'}</p>
                <p><strong>Diagnosis:</strong> ${record.diagnosis || 'Not specified'}</p>
                <p><strong>Treatment:</strong> ${record.treatment || 'Not specified'}</p>
                <p><strong>Notes:</strong> ${record.notes || 'None'}</p>
                <p><strong>Description:</strong> ${record.content || 'No description available'}</p>
                <p><strong>File:</strong> ${record.fileName || 'No file attached'}</p>
                <p><strong>Uploaded by:</strong> ${record.uploadedBy || 'Unknown'}</p>
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
        
        // Add to recent activities
        addActivity({
            id: `ACT-${Date.now()}`,
            type: 'record',
            title: 'Record Viewed',
            description: `You viewed a ${record.recordType || 'medical'} record`,
            timestamp: new Date().toISOString(),
            patientName: localStorage.getItem('userName')
        });
    } else {
        alert('Record not found');
    }
}

function downloadRecord(recordId) {
    // Get all medical records
    const allMedicalRecords = JSON.parse(localStorage.getItem('medicalRecords') || '[]');
    
    // Find the specific record
    const record = allMedicalRecords.find(r => r.id === recordId);
    
    if (record && record.fileUrl) {
        // In a real app, this would download the actual file from the server
        // For this demo, we'll simulate downloading the file
        
        // Check if the file exists in the backend folder
        fetch(record.fileUrl)
            .then(response => {
                if (response.ok) {
                    // File exists, download it
                    const a = document.createElement('a');
                    a.href = record.fileUrl;
                    a.download = record.fileName || `${record.recordType}_record.pdf`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    // Add to recent activities
                    addActivity({
                        id: `ACT-${Date.now()}`,
                        type: 'record',
                        title: 'Record Downloaded',
                        description: `You downloaded a ${record.recordType || 'medical'} record`,
                        timestamp: new Date().toISOString(),
                        patientName: localStorage.getItem('userName')
                    });
                } else {
                    // File doesn't exist, create a sample PDF
                    createAndDownloadSampleFile(record);
                }
            })
            .catch(error => {
                // Error fetching file, create a sample PDF
                createAndDownloadSampleFile(record);
            });
    } else {
        alert('No file available for download');
    }
}

function createAndDownloadSampleFile(record) {
    // Create a sample PDF content
    const pdfContent = `
        Medical Record: ${record.id}
        Patient: ${record.patientName}
        Date: ${new Date(record.recordDate || record.uploadDate).toLocaleDateString()}
        Doctor: ${record.doctor || 'Not specified'}
        Hospital: ${record.hospital || 'Not specified'}
        Diagnosis: ${record.diagnosis || 'Not specified'}
        Treatment: ${record.treatment || 'Not specified'}
        Notes: ${record.notes || 'None'}
        
        ${record.content || 'No description available'}
    `;
    
    // Create a Blob with the content
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    
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
    
    // Add to recent activities
    addActivity({
        id: `ACT-${Date.now()}`,
        type: 'record',
        title: 'Record Downloaded',
        description: `You downloaded a ${record.recordType || 'medical'} record`,
        timestamp: new Date().toISOString(),
        patientName: localStorage.getItem('userName')
    });
}

function addActivity(activity) {
    const activities = JSON.parse(localStorage.getItem('patientActivities') || '[]');
    activities.unshift(activity);
    
    // Keep only the 10 most recent activities
    const recentActivities = activities.slice(0, 10);
    
    // Save back to localStorage
    localStorage.setItem('patientActivities', JSON.stringify(recentActivities));
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Make functions available globally
window.viewRecord = viewRecord;
window.downloadRecord = downloadRecord;