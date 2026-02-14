# 🔐 Admin Login Credentials

## Default Admin Account

After running the setup script, use these credentials:

**Email:** `admin@vedasch olars.com`  
**Password:** `Admin@123`

---

## How to Create Admin Account

### Method 1: Run the Setup Script (Easiest)

```bash
cd c:\dev\flutter_projects\veda_scholars_backend
node scripts/createAdmin.js
```

This will create an admin user with the credentials above.

### Method 2: Manual MongoDB Update

1. Register a normal user through the app
2. Connect to MongoDB and run:

```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "admin", isApproved: true } }
)
```

---

## ⚠️ Security Note

**IMPORTANT:** Change the default password immediately after first login!

The default credentials are for initial setup only and should not be used in production.

---

## Testing the Admin Account

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Login through the Flutter app:**
   - Email: `admin@vedascholars.com`
   - Password: `Admin@123`

3. **Verify admin access:**
   - You should see the Admin Dashboard
   - Access to system stats
   - User management features
   - University approval controls
