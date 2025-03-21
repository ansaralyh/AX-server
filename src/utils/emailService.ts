import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: Boolean(process.env.SMTP_SECURE), // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    async sendEmail(options: EmailOptions): Promise<void> {
        const mailOptions = {
            from: process.env.SMTP_FROM_EMAIL,
            ...options,
        };

        await this.transporter.sendMail(mailOptions);
    }

    async sendApprovalEmail(to: string, password: string): Promise<void> {
        const subject = 'Your Driver Application Has Been Approved';
        const html = `
            <h1>Congratulations! Your Application Has Been Approved</h1>
            <p>Your driver application has been approved. You can now log in to your account using the following credentials:</p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Please change your password after your first login for security purposes.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
        `;

        await this.sendEmail({
            to,
            subject,
            text: `Your application has been approved. Login credentials - Email: ${to}, Password: ${password}`,
            html,
        });
    }

    async sendRejectionEmail(to: string, reason: string): Promise<void> {
        const subject = 'Update on Your Driver Application';
        const html = `
            <h1>Update on Your Driver Application</h1>
            <p>We regret to inform you that your driver application has not been approved at this time.</p>
            <p><strong>Reason:</strong> ${reason}</p>
            <p>If you have any questions or would like to discuss this further, please don't hesitate to contact us.</p>
        `;

        await this.sendEmail({
            to,
            subject,
            text: `Your application has not been approved. Reason: ${reason}`,
            html,
        });
    }
}

export const emailService = new EmailService(); 