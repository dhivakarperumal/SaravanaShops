const axios = require('axios');
require('dotenv').config();

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE_URL = 'https://graph.facebook.com';
const WHATSAPP_CHATTURN_TEMPLATE_URL = 'https://api.chatsturn.com/api/v1/whatsapp/send/template';

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
  const mockMode = process.env.WHATSAPP_MOCK_MODE === 'true';
  const configuredAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const configuredApiKey = process.env.WHATSAPP_API_KEY;
  const templateId = process.env.WHATSAPP_TEMPLATE_ID || '420492';
  const useChatTurnTemplate = Boolean(configuredApiKey && configuredApiKey.includes('|'));
  const accessToken = configuredApiKey && (!configuredAccessToken || !configuredAccessToken.startsWith('EAA'))
    ? configuredApiKey
    : configuredAccessToken || configuredApiKey;
  const useMockFallback = mockMode || process.env.NODE_ENV !== 'production';

  if (!phoneNumberId || !accessToken || mockMode) {
    console.warn(`[WhatsApp Mock] Would send OTP ${otp} to ${phone}`);
    return { success: true, mocked: true, otp };
  }

  if (useChatTurnTemplate) {
    const otpDigits = String(otp).replace(/\D/g, '').split('').filter(Boolean);
    const templateVariables = otpDigits
      .map((digit, index) => `templateVariable-otp-${index + 1}=${digit}`)
      .join('&');
    const formBody = [
      `apiToken=${configuredApiKey}`,
      `phone_number_id=${phoneNumberId}`,
      `template_id=${templateId}`,
      templateVariables
    ].filter(Boolean).join('&');

    try {
      const response = await axios.post(WHATSAPP_CHATTURN_TEMPLATE_URL, formBody, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      console.log(`WhatsApp ChatTurn message sent to ${phone}, response: ${response?.data?.status || 'success'}`);
      return { success: true, mocked: false, otp };
    } catch (error) {
      console.warn(`WhatsApp ChatTurn delivery failed for ${phone}; using mock OTP ${otp}`);
      return { success: true, mocked: true, otp };
    }
  }

  const formattedPhone = formatPhoneForApi(phone);
  const url = `${WHATSAPP_API_BASE_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: 'otp',
      language: {
        code: 'en_US'
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: otp
            }
          ]
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [
            {
              type: 'text',
              text: otp
            }
          ]
        }
      ]
    }
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...(configuredApiKey ? { 'X-API-Key': configuredApiKey } : {})
      }
    });

    console.log(`WhatsApp message sent to ${formattedPhone}, message_id: ${response.data.messages[0].id}`);
    return { success: true, mocked: false, otp };
  } catch (error) {
    const authError = error.response?.data?.error?.code === 190 || error.response?.status === 401 || error.response?.status === 400;
    const fallbackAccessToken = configuredAccessToken && configuredApiKey && accessToken !== configuredApiKey
      ? configuredApiKey
      : null;

    if (authError && fallbackAccessToken) {
      console.warn('Primary WhatsApp token rejected, retrying with configured API key.');
      try {
        const retriedResponse = await axios.post(url, payload, {
          headers: {
            'Authorization': `Bearer ${fallbackAccessToken}`,
            'Content-Type': 'application/json',
            ...(configuredApiKey ? { 'X-API-Key': configuredApiKey } : {})
          }
        });

        console.log(`WhatsApp message sent to ${formattedPhone}, message_id: ${retriedResponse.data.messages[0].id}`);
        return { success: true, mocked: false, otp };
      } catch (retryError) {
        console.warn(`WhatsApp retry also failed for ${phone}; using mock OTP ${otp}`);
        return { success: true, mocked: true, otp };
      }
    }

    if (authError) {
      console.warn(`WhatsApp auth failed for ${phone}; using mock OTP ${otp}`);
      return { success: true, mocked: true, otp };
    }

    if (useMockFallback) {
      console.warn(`WhatsApp delivery failed for ${phone}; using mock OTP ${otp}`);
      return { success: true, mocked: true, otp };
    }

    console.error('Error sending WhatsApp message:', error.response?.data || error.message);
    throw new Error('Failed to send WhatsApp message');
  }
}

module.exports = {
  sendOtpMessage,
  formatPhoneForApi
};
