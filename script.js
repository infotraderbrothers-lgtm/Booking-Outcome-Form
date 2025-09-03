// Configuration
const CLIENT_API_URL = 'https://booking-outcome-form.onrender.com'; // Your Render app URL
const MEETING_WEBHOOK_URL = 'https://hook.eu2.make.com/lnjsqwqvhg57sa6ud5gmv413d2rsg81o'; // Your existing webhook

let clientDatabase = {};

// Function to load clients from your database server
async function loadClientsFromDatabase() {
    try {
        console.log('Loading clients from database...');
        const response = await fetch(`${CLIENT_API_URL}/clients`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.clients && Object.keys(data.clients).length > 0) {
                clientDatabase = data.clients;
                console.log('✅ Clients loaded from database:', Object.keys(clientDatabase).length);
            } else {
                console.log('⚠️ No clients returned from database');
                clientDatabase = {};
            }
        } else {
            console.log('❌ Failed to load from database, status:', response.status);
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        console.error('❌ Error loading clients from database:', error);
        // Use empty database on error
        clientDatabase = {};
    }
    
    updateClientButtons();
}

// Update client buttons dynamically
function updateClientButtons() {
    const container = document.getElementById('clientButtons');
    container.innerHTML = '';
    
    // Show message if no clients
    if (Object.keys(clientDatabase).length === 0) {
        const noClientsMsg = document.createElement('span');
        noClientsMsg.className = 'loading-clients';
        noClientsMsg.textContent = 'No clients available. Add clients via Make.com API.';
        container.appendChild(noClientsMsg);
    } else {
        // Add client buttons
        Object.keys(clientDatabase).forEach(key => {
            const client = clientDatabase[key];
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'btn-secondary';
            button.onclick = () => populateClient(key);
            button.textContent = client.name;
            container.appendChild(button);
        });
    }
    
    // Add control buttons
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'btn-secondary';
    clearBtn.onclick = clearForm;
    clearBtn.textContent = 'Clear Form';
    container.appendChild(clearBtn);
    
    const refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.className = 'btn-secondary';
    refreshBtn.onclick = refreshClients;
    refreshBtn.textContent = 'Refresh Clients';
    container.appendChild(refreshBtn);
}

// Function to refresh clients from database
async function refreshClients() {
    const refreshBtn = document.querySelector('button[onclick="refreshClients()"]');
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.textContent = 'Refreshing...';
    }
    
    await loadClientsFromDatabase();
    
    if (refreshBtn) {
        refreshBtn.disabled = false;
        refreshBtn.textContent = 'Refresh Clients';
    }
}

// Auto-populate client information
function populateClient(clientKey) {
    const client = clientDatabase[clientKey];
    if (client) {
        document.getElementById('name').value = client.name;
        document.getElementById('email').value = client.email;
        document.getElementById('phone').value = client.phone || '';
        document.getElementById('clientId').value = client.clientId;
        
        // Add subtle animation
        const fields = ['name', 'email', 'phone', 'clientId'];
        fields.forEach((field, index) => {
            setTimeout(() => {
                const element = document.getElementById(field);
                element.style.background = '#e8f5e8';
                setTimeout(() => {
                    element.style.background = 'white';
                }, 500);
            }, index * 100);
        });
    }
}

// Clear form
function clearForm() {
    document.getElementById('meetingForm').reset();
    hideMessages();
}

// Hide all messages
function hideMessages() {
    document.getElementById('errorMessage').style.display = 'none';
    document.getElementById('loading').style.display = 'none';
}

// Screen management functions
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    // Show selected screen
    document.getElementById(screenId).classList.add('active');
}

function showFormScreen() {
    showScreen('formScreen');
}

function showReviewScreen() {
    // Validate form first
    const form = document.getElementById('meetingForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Populate review data
    document.getElementById('reviewName').textContent = document.getElementById('name').value;
    document.getElementById('reviewEmail').textContent = document.getElementById('email').value;
    document.getElementById('reviewPhone').textContent = document.getElementById('phone').value;
    document.getElementById('reviewClientId').textContent = document.getElementById('clientId').value;
    document.getElementById('reviewDetails').textContent = document.getElementById('details').value;
    document.getElementById('reviewOutcome').textContent = document.getElementById('outcome').value;
    
    showScreen('reviewScreen');
}

function showThankYouScreen() {
    showScreen('thankYouScreen');
}

function startNewEntry() {
    // Clear form and return to first screen
    clearForm();
    showFormScreen();
}

// Submit form function
async function submitForm() {
    const finalSubmitBtn = document.getElementById('finalSubmitBtn');
    const loading = document.getElementById('loading');
    
    // Hide previous messages
    hideMessages();
    
    // Show loading state
    finalSubmitBtn.disabled = true;
    finalSubmitBtn.textContent = 'Submitting...';
    loading.style.display = 'block';
    
    // Collect form data
    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        clientId: document.getElementById('clientId').value,
        details: document.getElementById('details').value,
        outcome: document.getElementById('outcome').value,
        timestamp: new Date().toISOString(),
        source: 'Meeting Record Form'
    };
    
    try {
        // Send to Make.com webhook (your existing meeting form webhook)
        const response = await fetch(MEETING_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            // Success - show thank you screen
            showThankYouScreen();
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
        
    } catch (error) {
        // Error
        console.error('Error submitting form:', error);
        document.getElementById('errorMessage').style.display = 'block';
    } finally {
        // Reset button state
        finalSubmitBtn.disabled = false;
        finalSubmitBtn.textContent = 'Submit';
        loading.style.display = 'none';
    }
}

// Load clients when page loads
window.addEventListener('load', function() {
    console.log('🚀 Page loaded, initializing client database...');
    loadClientsFromDatabase();
});
