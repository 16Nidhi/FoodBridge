import { Notification } from '../types';
import { sendEmail } from './emailService';

class NotificationService {
    async sendNotification(notification: Notification): Promise<void> {
        try {
            // Logic to send notification (e.g., email, SMS, etc.)
            await sendEmail(notification.recipient, notification.subject, notification.message);
        } catch (error) {
            console.error('Error sending notification:', error);
            throw new Error('Notification could not be sent');
        }
    }

    async getNotifications(userId: string): Promise<Notification[]> {
        // Logic to retrieve notifications for a user
        // This is a placeholder for actual database retrieval logic
        return [
            {
                id: '1',
                recipient: userId,
                subject: 'Food Donation Available',
                message: 'A new food donation is available for pickup.',
                timestamp: new Date(),
            },
        ];
    }
}

export default new NotificationService();