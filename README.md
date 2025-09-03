# Trader Brothers Client Database System

A complete client management system with a booking form frontend and REST API backend for managing client data via Make.com HTTP requests.

## 📁 File Structure

Your project should have this structure:
```
trader-brothers-client-database/
├── index.html          # Frontend booking form
├── script.js           # Frontend JavaScript
├── server.js           # Backend database server
├── package.json        # Dependencies
├── .gitignore          # Git ignore file
└── README.md           # This file
```

## 🚀 Setup Instructions

### Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and create a new repository
2. Name it `trader-brothers-client-database`
3. Make it **Public** (required for free Render deployment)
4. Don't initialize with README (we'll upload our own files)

### Step 2: Upload Files to GitHub

1. Click "uploading an existing file" or use Git commands
2. Upload these files in this exact order:
   - `package.json` (upload first)
   - `server.js`
   - `index.html`
   - `script.js`
   - `.gitignore`
   - `README.md`

### Step 3: Deploy Backend to Render

1. Go to [render.com](https://render.com) and create a free account
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `trader-brothers-client-db` (or your choice)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free"
5. Click "Create Web Service"
6. Wait for deployment (5-10 minutes)
7. Copy your Render URL (looks like: `https://trader-brothers-client-db.onrender.com`)

### Step 4: Deploy Frontend

You have several options for the frontend:

#### Option A: GitHub Pages (Recommended - Free)
1. In your GitHub repo, go to Settings → Pages
2. Under "Source", select "Deploy from a branch"
3. Select "main" branch and "/ (root)"
4. Click Save
5. Your form will be available at: `https://yourusername.github.io/trader-brothers-client-database`

#### Option B: Netlify (Alternative)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `index.html`, `script.js` files
3. Get your Netlify URL

#### Option C: Render Static Site
1. In Render, click "New +" → "Static Site"
2. Connect same GitHub repo
3. Set publish directory to `/`
4. Deploy

### Step 5: Configure Frontend

1. Open `script.js` in your repository
2. Find this line: `const CLIENT_API_URL = 'https://your-render-app-name.onrender.com';`
3. Replace with your actual Render URL from Step 3
4. Commit the change to GitHub

## 🔧 API Usage for Make.com

Your backend server provides these endpoints for Make.com HTTP requests:

### Base URL
Replace `YOUR-RENDER-URL` with your actual Render deployment URL.

### 📋 Available Endpoints

#### 1. Get All Clients (for form)
```
GET https://YOUR-RENDER-URL/clients
```
Returns clients formatted for the booking form.

#### 2. Get All Clients (raw data)
```
GET https://YOUR-RENDER-URL/clients/raw
```
Returns raw database format.

#### 3. Get Single Client by ID
```
GET https://YOUR-RENDER-URL/clients/123
```
Replace `123` with the database ID.

#### 4. Get Client by Client ID
```
GET https://YOUR-RENDER-URL/clients/clientId/TB-001
```
Replace `TB-001` with the client ID.

#### 5. Create New Client
```
POST https://YOUR-RENDER-URL/clients
Content-Type: application/json

{
    "clientId": "TB-004",
    "name": "New Client Name",
    "email": "client@email.com",
    "phone": "+44 7700 000000"
}
```

#### 6. Update Client by Database ID
```
PUT https://YOUR-RENDER-URL/clients/123
Content-Type: application/json

{
    "clientId": "TB-004",
    "name": "Updated Name",
    "email": "updated@email.com",
    "phone": "+44 7700 111111"
}
```

#### 7. Update Client by Client ID
```
PUT https://YOUR-RENDER-URL/clients/clientId/TB-004
Content-Type: application/json

{
    "name": "Updated Name",
    "email": "updated@email.com",
    "phone": "+44 7700 111111"
}
```

#### 8. Delete Client by Database ID
```
DELETE https://YOUR-RENDER-URL/clients/123
```

#### 9. Delete Client by Client ID
```
DELETE https://YOUR-RENDER-URL/clients/clientId/TB-004
```

#### 10. Get Statistics
```
GET https://YOUR-RENDER-URL/stats
```

#### 11. Health Check
```
GET https://YOUR-RENDER-URL/health
```

## 🔄 Make.com Integration Examples

### Example 1: Add New Client
1. In Make.com, create an HTTP module
2. Set Method to `POST`
3. Set URL to `https://YOUR-RENDER-URL/clients`
4. Add Header: `Content-Type: application/json`
5. Set Body:
```json
{
    "clientId": "{{clientId}}",
    "name": "{{fullName}}",
    "email": "{{email}}",
    "phone": "{{phone}}"
}
```

### Example 2: Get All Clients
1. HTTP module with `GET` method
2. URL: `https://YOUR-RENDER-URL/clients`
3. Use response in subsequent modules

### Example 3: Delete Client
1. HTTP module with `DELETE` method
2. URL: `https://YOUR-RENDER-URL/clients/clientId/{{clientId}}`

## 🧪 Testing Your Setup

### Test Backend
1. Visit your Render URL directly (e.g., `https://your-app.onrender.com`)
2. You should see a JSON response with API documentation
3. Try: `https://your-app.onrender.com/clients` to see default clients

### Test Frontend
1. Visit your frontend URL
2. The form should load with "Loading clients..." initially
3. After a few seconds, you should see client buttons (John Smith, Sarah Johnson, Mike Wilson)
4. Click a client button to auto-populate the form
5. Click "Refresh Clients" to reload from your database

### Test Make.com Integration
1. Create a test scenario in Make.com
2. Use the HTTP module to GET `https://your-render-url/clients`
3. Run the scenario - you should receive the client data

## 🔍 Troubleshooting

### Frontend can't load clients
- Check that `CLIENT_API_URL` in `script.js` matches your Render URL
- Check browser console for errors (F12 → Console)
- Ensure Render service is running (not sleeping)

### Render deployment fails
- Check that `package.json` was uploaded first
- Verify all dependencies are listed correctly
- Check Render build logs for specific errors

### CORS errors
- The server includes CORS headers - this should not be an issue
- If problems persist, check that requests are going to the correct URL

### Database not persisting
- Free Render services restart periodically and lose SQLite data
- For production, consider upgrading to a paid plan or using external database

## 📊 Default Clients

The system starts with three default clients:
- **John Smith** (TB-001)
- **Sarah Johnson** (TB-002) 
- **Mike Wilson** (TB-003)

You can add, update, or delete these via the API endpoints.

## 🔒 Security Notes

- This is a basic implementation suitable for development/testing
- For production use, consider adding authentication
- Input validation is basic - enhance as needed
- Free Render services have limitations - monitor usage

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Check Render logs for server errors
3. Verify all URLs are correct
4. Test API endpoints directly using a tool like Postman

## 🚀 Next Steps

Once everything is working:
1. Test all Make.com integrations
2. Add more clients via the API
3. Customize the booking form as needed
4. Consider upgrading to paid hosting for production use
