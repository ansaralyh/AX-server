import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const driverDocsDir = path.join(uploadsDir, 'driver-documents');

// Ensure directories exist with proper permissions
try {
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }
    if (!fs.existsSync(driverDocsDir)) {
        fs.mkdirSync(driverDocsDir, { recursive: true });
    }
} catch (error) {
    console.error('Error creating upload directories:', error);
    throw error;
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, driverDocsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(sanitizedFilename));
    }
});

// File filter
const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'));
    }
};

// Create multer upload instance
export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Create upload fields configuration
const driverDocumentUpload = upload.fields([
    { name: 'cdlDocument', maxCount: 1 },
    { name: 'medicalCertificate', maxCount: 1 },
    { name: 'drivingRecord', maxCount: 1 },
    { name: 'socialSecurityCard', maxCount: 1 },
    { name: 'profilePhoto', maxCount: 1 }
]);

export { driverDocumentUpload }; 