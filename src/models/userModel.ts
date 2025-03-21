import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'admin' | 'super-admin';
    phoneNumber?: string;
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getResetPasswordToken(): string;
}

const userSchema = new Schema<IUser>({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long'],
        select: false
    },
    role: {
        type: String,
        enum: ['admin', 'super-admin'],
        default: 'admin'
    },
    phoneNumber: {
        type: String,
        trim: true
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
    try {
        console.log('[Password Comparison] Starting password verification process...');
        console.log('[Password Comparison] Received password from login attempt:', candidatePassword);
        console.log('[Password Comparison] User\'s stored hashed password from database:', this.password);
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        console.log('Password match result:', isMatch);
        return isMatch;
    } catch (error) {
        console.error('Error comparing passwords:', error);
        return false;
    }
};

// Generate reset password token
userSchema.methods.getResetPasswordToken = function(): string {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    this.resetPasswordExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    return resetToken;
};

export default mongoose.model<IUser>('User', userSchema);