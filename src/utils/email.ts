import nodemailer from 'nodemailer';
import { config } from '../config';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: Number(config.email.port),
    secure: true,
    auth: {
        user: config.email.user,
        pass: config.email.pass
    }
});

export const sendEmail = async (options: EmailOptions): Promise<void> => {
    try {
        await transporter.sendMail({
            from: config.email.user,
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        });
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error('Failed to send email');
    }
}; 