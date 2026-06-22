const axios = require('axios');
require('dotenv').config();

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE_URL = 'https://graph.facebook.com';

/**
 * Normalizes a phone number for the WhatsApp API.
 * Ensures it has the country code (defaulting to 91 for India).
 */
function formatPhoneForApi(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }
  return cleaned;
}

/**
 * Sends an OTP message via WhatsApp Cloud API.
 * @param {string} phone 
 * @param {string} otp 
 */
async function sendOtpMessage(phone, otp) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn(`[WhatsApp Mock] Would send OTP ${otp} to ${phone}`);
    return true; // Mock mode
  }

  const formattedPhone = formatPhoneForApi(phone);
  const url = `${WHATSAPP_API_BASE_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      preview_url: false,
      body: `Your Q Techx login OTP is: *${otp}*. It is valid for 5 minutes. Do not share it with anyone.`
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`WhatsApp message sent to ${formattedPhone}, message_id: ${response.data.messages[0].id}`);
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw new Error('Failed to send WhatsApp message');
  }
}

module.exports = {
  sendOtpMessage,
  formatPhoneForApi
};
