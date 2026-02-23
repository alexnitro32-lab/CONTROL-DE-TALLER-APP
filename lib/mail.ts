import { Resend } from 'resend';

// Helper to check if API key exists
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

type EmailPayload = {
    to: string;
    subject: string;
    html: string;
};

export async function sendEmail({ to, subject, html }: EmailPayload) {
    if (!resend) {
        console.log('---------------------------------------------------');
        console.log(`[MOCK EMAIL] To: ${to}`);
        console.log(`[MOCK EMAIL] Subject: ${subject}`);
        console.log(`[MOCK EMAIL] Body: ${html}`);
        console.log('---------------------------------------------------');
        return { success: true, mock: true };
    }

    try {
        const data = await resend.emails.send({
            from: 'Control Taller <no-reply@resend.dev>', // Use registered domain in prod
            to,
            subject,
            html,
        });
        return { success: true, data };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}
