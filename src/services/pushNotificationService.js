const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin SDK
// You need to set GOOGLE_APPLICATION_CREDENTIALS env var or provide path to service account key
// const serviceAccount = require('../path/to/serviceAccountKey.json');

// Check if already initialized to avoid errors
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(), // Or admin.credential.cert(serviceAccount)
        });
        console.log('Firebase Admin Initialized');
    } catch (error) {
        console.log('Firebase Admin Initialization Failed (Expected if no credentials provided):', error.message);
    }
}

const sendPushNotification = async (userId, title, body, data = {}) => {
    try {
        if (!admin.apps.length) {
            console.log('Firebase not initialized, skipping notification');
            return;
        }

        const user = await User.findById(userId);
        if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
            return;
        }

        const message = {
            notification: {
                title: title,
                body: body,
            },
            data: {
                click_action: 'FLUTTER_NOTIFICATION_CLICK',
                ...data
            },
            tokens: user.fcmTokens,
        };

        const response = await admin.messaging().sendMulticast(message);

        // Remove invalid tokens
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    failedTokens.push(user.fcmTokens[idx]);
                }
            });

            if (failedTokens.length > 0) {
                await User.updateOne({ _id: userId }, { $pull: { fcmTokens: { $in: failedTokens } } });
            }
        }

        console.log(`Push notification sent to user ${userId}: ${response.successCount} successful`);

    } catch (error) {
        console.error('Error sending push notification:', error);
    }
};

module.exports = { sendPushNotification };
