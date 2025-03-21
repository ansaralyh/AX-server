export const config = {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    setupSecretKey: process.env.SETUP_SECRET_KEY || 'setup-secret-key',
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/driver-app',
    email: {
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
}; 