const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

const DEFAULT_WHATSAPP_TIMEOUT_MS = Number(process.env.WHATSAPP_API_TIMEOUT_MS || 20000);
const axiosInstance = axios.create({
  timeout: DEFAULT_WHATSAPP_TIMEOUT_MS,
});

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_BASE_URL = 'https://graph.facebook.com';
const CHATSTURN_API_BASE_URL = 'https://api.chatsturn.com/api/v1/whatsapp';
const CHATSTURN_TEMPLATE_ENDPOINT = `${CHATSTURN_API_BASE_URL}/send/template`;
const CHATSTURN_TEXT_ENDPOINT = `${CHATSTURN_API_BASE_URL}/send/text`;

/**
 * Normalizes a phone number for the WhatsApp API.
 * Supports both full international phone numbers and local 10-digit numbers.
 */
function formatPhoneForApi(phone) {
  let cleaned = phone?.toString().trim().replace(/\D/g, '');
  if (!cleaned) {
    return '';
  }

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.replace(/^0+/, '');
  }

  if (cleaned.length === 10) {
    const defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91';
    cleaned = `${defaultCountryCode}${cleaned}`;
  }

  // Remove duplicate country codes like 9191xxxxx if entered incorrectly
  const defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91';
  const repeatedPrefix = `${defaultCountryCode}${defaultCountryCode}`;
  if (cleaned.startsWith(repeatedPrefix)) {
    cleaned = cleaned.slice(defaultCountryCode.length);
  }

  return cleaned;
}

function buildMetaTemplatePayload(formattedPhone, templateName, otp) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: process.env.WHATSAPP_TEMPLATE_LANGUAGE || 'en_US'
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
        }
      ]
    }
  };
}

function buildMetaTextPayload(formattedPhone, otp) {
  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: formattedPhone,
    type: 'text',
    text: {
      body: `Your OTP is ${otp}. It expires in 5 minutes.`
    }
  };
}

function buildChatSturnTemplatePayload(phoneNumberId, templateId, otp, toPhone, apiToken) {
  const payload = {
    apiToken,
    phone_number_id: phoneNumberId,
    template_id: templateId,
    phone: toPhone,
    phone_number: toPhone,
    phoneNumber: toPhone,
    mobile: toPhone,
    mobile_number: toPhone
  };

  const templateVariables = process.env.WHATSAPP_MESSAGE_TEMPLATE_VARIABLES
    ? process.env.WHATSAPP_MESSAGE_TEMPLATE_VARIABLES.split(',').map((value) => value.trim()).filter(Boolean)
    : ['otp-1'];

  templateVariables.forEach((variableName) => {
    payload[`templateVariable-${variableName}`] = otp;
  });

  return qs.stringify(payload);
}

function getChatSturnTextPayload(phoneNumberId, otp, toPhone, apiToken) {
  return qs.stringify({
    apiToken,
    phone_number_id: phoneNumberId,
    phone: toPhone,
    phone_number: toPhone,
    phoneNumber: toPhone,
    mobile: toPhone,
    mobile_number: toPhone,
    message_text: `Your OTP is ${otp}. It expires in 5 minutes.`
  });
}

async function sendChatSturnTextMessage(url, payload) {
  try {
    const response = await axiosInstance.post(url, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      }
    });

    const responseData = response.data || {};
    const statusValue = responseData?.status?.toString().toLowerCase();
    const success = statusValue === '1' || statusValue === 'success' || statusValue === 'ok';

    if (!success) {
      const message = responseData?.message || JSON.stringify(responseData);
      const error = new Error(`ChatSturn text API failed: ${message}`);
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    error.message = error.message || 'ChatSturn text API request failed';
    throw error;
  }
}

async function sendChatSturnMessage(url, payload) {
  try {
    const response = await axiosInstance.post(url, payload, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json'
      }
    });

    const responseData = response.data || {};
    const statusValue = responseData?.status?.toString().toLowerCase();
    const success = statusValue === '1' || statusValue === 'success' || statusValue === 'ok';

    if (!success) {
      const message = responseData?.message || JSON.stringify(responseData);
      const error = new Error(`ChatSturn API failed: ${message}`);
      error.response = response;
      throw error;
    }

    return response;
  } catch (error) {
    error.message = error.message || 'ChatSturn API request failed';
    throw error;
  }
}

async function sendMetaWhatsAppMessage(url, accessToken, payload) {
  try {
    return await axiosInstance.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    error.message = error.message || 'Meta WhatsApp API request failed';
    throw error;
  }
}

function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = phone.toString().trim().replace(/\D/g, '');
  if (cleaned.startsWith('0')) cleaned = cleaned.replace(/^0+/, '');
  if (cleaned.length === 10) {
    const defaultCountryCode = process.env.WHATSAPP_DEFAULT_COUNTRY_CODE || '91';
    cleaned = `${defaultCountryCode}${cleaned}`;
  }
  return cleaned;
}

function getAllowedRecipients() {
  return process.env.WHATSAPP_ALLOWED_RECIPIENTS
    ? process.env.WHATSAPP_ALLOWED_RECIPIENTS
        .split(',')
        .map((value) => normalizePhone(value))
        .filter(Boolean)
    : [];
}

function assertAllowedRecipient(formattedPhone) {
  const allowed = getAllowedRecipients();
  if (allowed.length === 0) return;

  const normalizedTarget = normalizePhone(formattedPhone);
  if (!allowed.includes(normalizedTarget)) {
    throw new Error(`WhatsApp sending is restricted to allowed recipients only: ${formattedPhone}`);
  }
}

async function sendOtpMessage(phone, otp) {
  const formattedPhone = formatPhoneForApi(phone);

  if (!formattedPhone || formattedPhone.length < 10) {
    throw new Error('Invalid phone number for WhatsApp');
  }

  const mockMode = String(process.env.WHATSAPP_MOCK_MODE).toLowerCase() === 'true';
  const fallbackToMock = String(process.env.WHATSAPP_FALLBACK_TO_MOCK).toLowerCase() === 'true';
  const useMockFallback = mockMode || fallbackToMock;
  const configuredApiKey = process.env.WHATSAPP_API_KEY;
  const configuredAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const hasChatSturnConfig = Boolean(process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_KEY) && Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID) && Boolean(process.env.WHATSAPP_MESSAGE_TEMPLATE_ID);
  const hasMetaConfig = Boolean(process.env.WHATSAPP_ACCESS_TOKEN) && Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID);
  const configuredProvider = process.env.WHATSAPP_PROVIDER?.toLowerCase();

  if (mockMode) {
    console.warn('[WhatsApp] Mock mode enabled, skipping real WhatsApp send.');
    return true;
  }

  let provider = configuredProvider;
  if (provider && !['chatsturn', 'meta', 'mock'].includes(provider)) {
    console.warn(`[WhatsApp] Unknown provider '${provider}', auto-selecting provider instead.`);
    provider = undefined;
  }

  if (!provider) {
    if (hasChatSturnConfig) provider = 'chatsturn';
    else if (hasMetaConfig) provider = 'meta';
    else provider = 'mock';
  }

  if (provider === 'mock') {
    console.warn('[WhatsApp] No WhatsApp provider configured, falling back to mock send.');
    return true;
  }

  assertAllowedRecipient(formattedPhone);

  if (provider === 'chatsturn') {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const apiToken = process.env.WHATSAPP_API_TOKEN || process.env.WHATSAPP_API_KEY;
    const templateId = process.env.WHATSAPP_MESSAGE_TEMPLATE_ID;
    const useChatSturnText = String(process.env.WHATSAPP_CHATSTURN_USE_TEXT).toLowerCase() === 'true';
    const fallbackToChatSturnText = String(process.env.WHATSAPP_CHATSTURN_FALLBACK_TO_TEXT).toLowerCase() === 'true';

    if (!hasChatSturnConfig) {
      if (hasMetaConfig) {
        console.warn('[WhatsApp] ChatSturn config incomplete, falling back to Meta provider.');
      } else {
        if (mockMode) {
          console.warn('[WhatsApp] No WhatsApp provider configured, falling back to mock send.');
          return true;
        }
        throw new Error('WhatsApp provider configuration is incomplete');
      }
    }

    if (hasChatSturnConfig) {
      const toPhone = formattedPhone;
      const useTextFlow = useChatSturnText || !templateId || String(process.env.WHATSAPP_USE_TEMPLATE).toLowerCase() === 'false';

      const sendTemplate = async () => {
        const payload = buildChatSturnTemplatePayload(phoneNumberId, templateId, otp, toPhone, apiToken);
        const response = await sendChatSturnMessage(CHATSTURN_TEMPLATE_ENDPOINT, payload);
        console.log(`ChatSturn WhatsApp template sent to ${formattedPhone}`, response.data);
        return response;
      };

      const sendText = async () => {
        const payload = getChatSturnTextPayload(phoneNumberId, otp, toPhone, apiToken);
        const response = await sendChatSturnTextMessage(CHATSTURN_TEXT_ENDPOINT, payload);
        console.log(`ChatSturn WhatsApp text sent to ${formattedPhone}`, response.data);
        return response;
      };

      if (useTextFlow) {
        try {
          await sendText();
          return true;
        } catch (error) {
          console.error('ChatSturn WhatsApp text send failed:', error.response?.data || error.message);

          if (templateId) {
            console.warn('[WhatsApp] ChatSturn text send failed, falling back to template send.');
            try {
              await sendTemplate();
              return true;
            } catch (templateError) {
              console.error('ChatSturn template fallback failed after text failure:', templateError.response?.data || templateError.message);
            }
          }

          if (hasMetaConfig) {
            console.warn('[WhatsApp] ChatSturn text send failed, falling back to Meta provider.');
          } else if (mockMode || fallbackToMock) {
            console.warn('[WhatsApp] ChatSturn text send failed and fallback to mock is enabled, skipping real send.');
            return true;
          } else {
            throw new Error(error.response?.data?.message || error.message || 'Failed to send WhatsApp message via ChatSturn text');
          }
        }
      }

      try {
        await sendTemplate();
        return true;
      } catch (error) {
        console.error('ChatSturn WhatsApp template send failed:', error.response?.data || error.message);

        if (fallbackToChatSturnText) {
          try {
            await sendText();
            return true;
          } catch (textError) {
            console.error('ChatSturn WhatsApp text fallback failed:', textError.response?.data || textError.message);
          }
        }

        const fallbackToMock = String(process.env.WHATSAPP_FALLBACK_TO_MOCK).toLowerCase() === 'true';
        if (hasMetaConfig) {
          console.warn('[WhatsApp] ChatSturn template send failed, falling back to Meta provider.');
        } else if (mockMode || fallbackToMock) {
          console.warn('[WhatsApp] ChatSturn send failed and fallback to mock is enabled, skipping real send.');
          return true;
        } else {
          throw new Error(error.response?.data?.message || error.message || 'Failed to send WhatsApp message via ChatSturn');
        }
      }
    }
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const templateName = process.env.WHATSAPP_MESSAGE_TEMPLATE_NAME || 'otp';
  const useTemplate = process.env.WHATSAPP_USE_TEMPLATE !== 'false';

  if (!hasMetaConfig) {
    if (mockMode || String(process.env.WHATSAPP_FALLBACK_TO_MOCK).toLowerCase() === 'true') {
      console.warn('[WhatsApp] Meta WhatsApp configuration is incomplete; mock fallback enabled.');
      return true;
    }
    throw new Error('Meta WhatsApp configuration is incomplete');
  }

  const url = `${WHATSAPP_API_BASE_URL}/${WHATSAPP_API_VERSION}/${phoneNumberId}/messages`;
  const templatePayload = buildMetaTemplatePayload(formattedPhone, templateName, otp);
  const textPayload = buildMetaTextPayload(formattedPhone, otp);
  const payload = useTemplate ? templatePayload : textPayload;

  try {
    const response = await sendMetaWhatsAppMessage(url, accessToken, payload);

    if (response.data?.messages?.length) {
      console.log(`WhatsApp message sent to ${formattedPhone}, message_id: ${response.data.messages[0].id}`);
    } else {
      console.log(`WhatsApp message response for ${formattedPhone}:`, response.data);
    }

    return true;
  } catch (error) {
    const authError = error.response?.data?.error?.code === 190 || error.response?.status === 401 || error.response?.status === 400;
    const fallbackAccessToken = configuredAccessToken && configuredApiKey && accessToken !== configuredApiKey
      ? configuredApiKey
      : null;

    if (authError && fallbackAccessToken) {
      console.warn('Primary WhatsApp token rejected, retrying with configured API key.');
      try {
        const retriedResponse = await axiosInstance.post(url, payload, {
          headers: {
            Authorization: `Bearer ${fallbackAccessToken}`,
            'Content-Type': 'application/json',
            ...(configuredApiKey ? { 'X-API-Key': configuredApiKey } : {})
          }
        });

        console.log(`WhatsApp message sent to ${formattedPhone}, message_id: ${retriedResponse.data.messages?.[0]?.id}`);
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
    const errorMessage = error.response?.data?.error?.message || error.message || 'Failed to send WhatsApp message';

    if (useTemplate) {
      console.warn('[WhatsApp] Template send failed, falling back to plain text message.');
      try {
        const response = await sendMetaWhatsAppMessage(url, accessToken, textPayload);
        if (response.data?.messages?.length) {
          console.log(`WhatsApp fallback text message sent to ${formattedPhone}, message_id: ${response.data.messages[0].id}`);
        } else {
          console.log(`WhatsApp fallback response for ${formattedPhone}:`, response.data);
        }
        return true;
      } catch (fallbackError) {
        console.error('WhatsApp fallback text send failed:', fallbackError.response?.data || fallbackError.message);
        throw new Error(fallbackError.response?.data?.error?.message || fallbackError.message || errorMessage);
      }
    }

    throw new Error(errorMessage);
  }
}

module.exports = {
  sendOtpMessage,
  formatPhoneForApi
};
