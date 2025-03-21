export const config = {
    jwtSecret: (process.env.JWT_SECRET || 'your-secret-key').replace(/['"]/g, ''),
    setupSecretKey: (process.env.SETUP_SECRET_KEY || 'abcd1234').replace(/['"]/g, ''),
    defaultAdminEmail: (process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com').replace(/['"]/g, ''),
    defaultAdminPassword: (process.env.DEFAULT_ADMIN_PASSWORD || 'admin123').replace(/['"]/g, ''),
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/driver-app',
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
}; 