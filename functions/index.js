const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const crypto = require('crypto');

admin.initializeApp();
dotenv.config();

function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(text) {
    const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

exports.hubspotAuthCallback = functions.https.onRequest(async (req, res) => {
    const code = req.query.code;
    if (!code) {
        return res.status(400).send('Authorization code is required');
    }
    const clientId = process.env.HUBSPOT_CLIENT_ID;
    const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
    const redirectUri = process.env.REDIRECT_URI;

    try {
        const response = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
            params: {
                grant_type: 'authorization_code',
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                code: code
            }
        });

        const { access_token, refresh_token } = response.data;
        await admin.firestore().collection('tokens').doc('hubspot').set({
            access_token: encrypt(access_token),
            refresh_token: encrypt(refresh_token),
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).send('Authorization successful');
    } catch (error) {
        console.error('Error exchanging authorization code for tokens:', error);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

exports.getHubSpotPortalInfo = functions.https.onRequest(async (req, res) => {
    const tokenDoc = await admin.firestore().collection('tokens').doc('hubspot').get();
    if (!tokenDoc.exists) {
        return res.status(404).send('No tokens found');
    }

    const { access_token, refresh_token } = tokenDoc.data();
    const decryptedAccessToken = decrypt(access_token);
    const decryptedRefreshToken = decrypt(refresh_token);

    try {
        const response = await axios.get('https://api.hubapi.com/integrations/v1/me', {
            headers: {
                Authorization: `Bearer ${decryptedAccessToken}`
            }
        });

        const portalInfo = response.data;
        res.status(200).json(portalInfo);
    } catch (error) {
        if (error.response && error.response.status === 401) {
            // Access token expired, refresh it
            try {
                const refreshResponse = await axios.post('https://api.hubapi.com/oauth/v1/token', null, {
                    params: {
                        grant_type: 'refresh_token',
                        client_id: process.env.HUBSPOT_CLIENT_ID,
                        client_secret: process.env.HUBSPOT_CLIENT_SECRET,
                        refresh_token: decryptedRefreshToken
                    }
                });

                const { access_token: newAccessToken } = refreshResponse.data;
                await admin.firestore().collection('tokens').doc('hubspot').update({
                    access_token: encrypt(newAccessToken),
                    created_at: admin.firestore.FieldValue.serverTimestamp()
                });

                // Retry the original request with the new access token
                const retryResponse = await axios.get('https://api.hubapi.com/integrations/v1/me', {
                    headers: {
                        Authorization: `Bearer ${newAccessToken}`
                    }
                });

                const portalInfo = retryResponse.data;
                return res.status(200).json(portalInfo);
            } catch (refreshError) {
                console.error('Error refreshing access token:', refreshError);
                return res.status(500).send('Internal Server Error');
            }
        }
        console.error('Error fetching HubSpot portal info:', error);
        res.status(500).send('Internal Server Error');
    }
});

exports.duplicateDeal = functions.pubsub.schedule('every 24 hours').onRun(async (context) => {
    const deals = await getDealsFromHubSpot();
    for (const deal of deals) {
        const dealDoc = await admin.firestore().collection('deals').doc(deal.id.toString()).get();
        if (dealDoc.exists && dealDoc.data().processed) {
            continue; // Skip already processed deals
        }

        await duplicateDealInHubSpot(deal);
        await admin.firestore().collection('deals').doc(deal.id.toString()).set({
            processed: true,
            last_updated: admin.firestore.FieldValue.serverTimestamp()
        });
    }
});

async function getDealsFromHubSpot() {
    const tokenDoc = await admin.firestore().collection('tokens').doc('hubspot').get();
    if (!tokenDoc.exists) {
        throw new Error('No tokens found');
    }

    const { access_token } = tokenDoc.data();
    const decryptedAccessToken = decrypt(access_token);

    let deals = [];
    let hasMore = true;
    let offset = 0;

    try {
        while (hasMore) {
            const response = await axios.get('https://api.hubapi.com/deals/v1/deal/paged', {
                headers: {
                    Authorization: `Bearer ${decryptedAccessToken}`
                },
                params: {
                    limit: 100,
                    offset: offset
                }
            });

            deals = deals.concat(response.data.deals);
            hasMore = response.data.hasMore;
            offset = response.data.offset;
        }

        return deals;
    } catch (error) {
        console.error('Error fetching deals from HubSpot:', error);
        throw error;
    }
}

async function duplicateDealInHubSpot(deal) {
    const tokenDoc = await admin.firestore().collection('tokens').doc('hubspot').get();
    if (!tokenDoc.exists) {
        throw new Error('No tokens found');
    }

    const { access_token } = tokenDoc.data();
    const decryptedAccessToken = decrypt(access_token);

    try {
        const response = await axios.post('https://api.hubapi.com/deals/v1/deal', deal, {
            headers: {
                Authorization: `Bearer ${decryptedAccessToken}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error duplicating deal in HubSpot:', error);
        throw error;
    }
}