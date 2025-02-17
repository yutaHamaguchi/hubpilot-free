const functions = require('firebase-functions');
const axios = require('axios');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

admin.initializeApp();
dotenv.config();

exports.hubspotAuthCallback = functions.https.onRequest(async (req, res) => {
    const code = req.query.code;
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
            access_token,
            refresh_token,
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

    const { access_token } = tokenDoc.data();

    try {
        const response = await axios.get('https://api.hubapi.com/integrations/v1/me', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        const portalInfo = response.data;
        res.status(200).json(portalInfo);
    } catch (error) {
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

    try {
        const response = await axios.get('https://api.hubapi.com/deals/v1/deal/paged', {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        return response.data.deals;
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

    try {
        const response = await axios.post('https://api.hubapi.com/deals/v1/deal', deal, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error duplicating deal in HubSpot:', error);
        throw error;
    }
}