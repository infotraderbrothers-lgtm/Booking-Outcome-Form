const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const dbPath = path.join(__dirname, 'clients.db');
const db = new sqlite3.Database(dbPath);

// Initialize database table
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Insert some default clients if table is empty
    db.get("SELECT COUNT(*) as count FROM clients", (err, row) => {
        if (!err && row.count === 0) {
            console.log('Inserting default clients...');
            const defaultClients = [
                { clientId: 'TB-001', name: 'John Smith', email: 'john.smith@email.com', phone: '+44 7700 123456' },
                { clientId: 'TB-002', name: 'Sarah Johnson', email: 'sarah.johnson@email.com', phone: '+44 7700 789123' },
                { clientId: 'TB-003', name: 'Mike Wilson', email: 'mike.wilson@email.com', phone: '+44 7700 456789' }
            ];
            
            defaultClients.forEach(client => {
                db.run("INSERT INTO clients (clientId, name, email, phone) VALUES (?, ?, ?, ?)", 
                    [client.clientId, client.name, client.email, client.phone]);
            });
            console.log('Default clients added successfully');
        }
    });
});

// Helper function to format clients for your form
function formatClientsForForm(clients) {
    const formattedClients = {};
    
    clients.forEach(client => {
        const key = client.name.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 10);
        formattedClients[key] = {
            id: client.id,
            name: client.name,
            email: client.email,
            phone: client.phone || '',
            clientId: client.clientId
        };
    });
    
    return formattedClients;
}

// Root endpoint with API documentation
app.get('/', (req, res) => {
    res.json({
        status: 'Client Database Server is running',
        version: '1.0.0',
        endpoints: {
            'GET /clients': 'Get all clients (formatted for booking form)',
            'GET /clients/raw': 'Get all clients (raw database format)',
            'GET /clients/:id': 'Get client by database ID',
            'GET /clients/clientId/:clientId': 'Get client by Client ID (e.g., TB-001)',
            'POST /clients': 'Create new client',
            'PUT /clients/:id': 'Update client by database ID',
            'PUT /clients/clientId/:clientId': 'Update client by Client ID',
            'DELETE /clients/:id': 'Delete client by database ID',
            'DELETE /clients/clientId/:clientId': 'Delete client by Client ID'
        },
        database: {
            location: dbPath,
            status: 'Connected'
        }
    });
});

// GET all clients (formatted for your booking form)
app.get('/clients', (req, res) => {
    db.all("SELECT * FROM clients ORDER BY name", (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        const clients = formatClientsForForm(rows);
        res.json({ clients, count: rows.length });
    });
});

// GET all clients (raw format)
app.get('/clients/raw', (req, res) => {
    db.all("SELECT * FROM clients ORDER BY name", (err, rows) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        res.json({ clients: rows, count: rows.length });
    });
});

// GET client by database ID
app.get('/clients/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    db.get("SELECT * FROM clients WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        res.json({ client: row });
    });
});

// GET client by Client ID (e.g., TB-001)
app.get('/clients/clientId/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    
    db.get("SELECT * FROM clients WHERE clientId = ?", [clientId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        res.json({ client: row });
    });
});

// POST - Create new client
app.post('/clients', (req, res) => {
    const { clientId, name, email, phone } = req.body;
    
    // Validate required fields
    if (!clientId || !name || !email) {
        return res.status(400).json({ 
            error: 'Missing required fields: clientId, name, and email are required' 
        });
    }
    
    // Validate email format (basic)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    
    const sql = "INSERT INTO clients (clientId, name, email, phone) VALUES (?, ?, ?, ?)";
    db.run(sql, [clientId, name, email, phone || null], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ 
                    error: 'Client ID already exists', 
                    clientId: clientId 
                });
            }
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        // Return the created client
        db.get("SELECT * FROM clients WHERE id = ?", [this.lastID], (err, row) => {
            if (err) {
                return res.status(500).json({ 
                    error: 'Client created but failed to retrieve', 
                    id: this.lastID 
                });
            }
            
            res.status(201).json({
                success: true,
                message: 'Client created successfully',
                client: row
            });
        });
    });
});

// PUT - Update client by database ID
app.put('/clients/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { clientId, name, email, phone } = req.body;
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // Validate email if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
    }
    
    const sql = "UPDATE clients SET clientId = ?, name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
    db.run(sql, [clientId, name, email, phone, id], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ 
                    error: 'Client ID already exists', 
                    clientId: clientId 
                });
            }
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Return the updated client
        db.get("SELECT * FROM clients WHERE id = ?", [id], (err, row) => {
            if (err) {
                return res.status(500).json({ 
                    error: 'Client updated but failed to retrieve' 
                });
            }
            
            res.json({
                success: true,
                message: 'Client updated successfully',
                client: row
            });
        });
    });
});

// PUT - Update client by Client ID
app.put('/clients/clientId/:clientId', (req, res) => {
    const currentClientId = req.params.clientId;
    const { clientId: newClientId, name, email, phone } = req.body;
    
    // Validate email if provided
    if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
    }
    
    const sql = "UPDATE clients SET clientId = ?, name = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE clientId = ?";
    db.run(sql, [newClientId || currentClientId, name, email, phone, currentClientId], function(err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ 
                    error: 'Client ID already exists', 
                    clientId: newClientId || currentClientId 
                });
            }
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Return the updated client
        db.get("SELECT * FROM clients WHERE clientId = ?", [newClientId || currentClientId], (err, row) => {
            if (err) {
                return res.status(500).json({ 
                    error: 'Client updated but failed to retrieve' 
                });
            }
            
            res.json({
                success: true,
                message: 'Client updated successfully',
                client: row
            });
        });
    });
});

// DELETE client by database ID
app.delete('/clients/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    // First get the client to return its info
    db.get("SELECT * FROM clients WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Now delete the client
        db.run("DELETE FROM clients WHERE id = ?", [id], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    error: 'Database error', 
                    details: err.message 
                });
            }
            
            res.json({
                success: true,
                message: 'Client deleted successfully',
                deletedClient: row
            });
        });
    });
});

// DELETE client by Client ID
app.delete('/clients/clientId/:clientId', (req, res) => {
    const clientId = req.params.clientId;
    
    // First get the client to return its info
    db.get("SELECT * FROM clients WHERE clientId = ?", [clientId], (err, row) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ 
                error: 'Database error', 
                details: err.message 
            });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Client not found' });
        }
        
        // Now delete the client
        db.run("DELETE FROM clients WHERE clientId = ?", [clientId], function(err) {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    error: 'Database error', 
                    details: err.message 
                });
            }
            
            res.json({
                success: true,
                message: 'Client deleted successfully',
                deletedClient: row
            });
        });
    });
});

// Database stats endpoint
app.get('/stats', (req, res) => {
    db.get("SELECT COUNT(*) as total FROM clients", (err, row) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        db.get("SELECT created_at FROM clients ORDER BY created_at DESC LIMIT 1", (err, latest) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            
            res.json({
                totalClients: row.total,
                latestClient: latest?.created_at || null,
                server: {
                    uptime: Math.floor(process.uptime()),
                    memory: process.memoryUsage(),
                    version: '1.0.0'
                }
            });
        });
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime())
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        details: error.message 
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /', 'GET /clients', 'GET /clients/raw', 'POST /clients', 
            'PUT /clients/:id', 'DELETE /clients/:id', 'GET /stats', 'GET /health'
        ]
    });
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed.');
        }
        process.exit(0);
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Client Database Server running on port ${PORT}`);
    console.log(`📊 Access at: http://localhost:${PORT}`);
    console.log(`💾 Database: ${dbPath}`);
    console.log(`🚀 Server started at: ${new Date().toISOString()}`);
});

module.exports = app;
