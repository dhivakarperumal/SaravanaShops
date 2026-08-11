const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'development';
process.env.WHATSAPP_MOCK_MODE = 'false';
process.env.WHATSAPP_PHONE_NUMBER_ID = '1154914131048872';
process.env.WHATSAPP_ACCESS_TOKEN = 'graph-access-token';
process.env.WHATSAPP_API_KEY = '22538|demo-api-key';
process.env.WHATSAPP_MESSAGE_TEMPLATE_ID = '420492';
process.env.WHATSAPP_MESSAGE_TEMPLATE_VARIABLES = 'otp-1,otp-2,otp-3,otp-4,otp-5,otp-6';

const { buildChatSturnTemplatePayload, getChatSturnTemplateVariableNames, sendOtpMessage } = require('../src/services/whatsappService');

test('builds the ChatTurn template payload with every requested variable slot', () => {
  const payload = buildChatSturnTemplatePayload(
    '1154914131048872',
    '420492',
    '123456',
    '9876543210',
    '22538|demo-api-key'
  );

  assert.match(payload, /apiToken=22538%7Cdemo-api-key/);
  assert.match(payload, /phone_number_id=1154914131048872/);
  assert.match(payload, /template_id=420492/);
  assert.match(payload, /phone_number=9876543210/);
  assert.match(payload, /templateVariable-otp-1=123456/);
  assert.match(payload, /templateVariable-otp-2=123456/);
  assert.match(payload, /templateVariable-otp-3=123456/);
  assert.match(payload, /templateVariable-otp-4=123456/);
  assert.match(payload, /templateVariable-otp-5=123456/);
  assert.match(payload, /templateVariable-otp-6=123456/);
});

test('accepts template variable names that arrive with a line break / new enter in the env value', () => {
  process.env.WHATSAPP_MESSAGE_TEMPLATE_VARIABLES = 'otp-1,\notp-2';

  const names = getChatSturnTemplateVariableNames();
  assert.deepEqual(names, ['otp-1', 'otp-2']);

  const payload = buildChatSturnTemplatePayload(
    '1154914131048872',
    '420492',
    '123456',
    '9876543210',
    '22538|demo-api-key'
  );

  assert.match(payload, /templateVariable-otp-1=123456/);
  assert.match(payload, /templateVariable-otp-2=123456/);

  process.env.WHATSAPP_MESSAGE_TEMPLATE_VARIABLES = 'otp-1,otp-2';
});

test('falls back to a local OTP object when the ChatSturn endpoint rejects the token with 401/Unauthenticated', async () => {
  process.env.WHATSAPP_PROVIDER = 'chatsturn';
  process.env.WHATSAPP_MOCK_MODE = 'false';
  process.env.WHATSAPP_FALLBACK_TO_MOCK = 'false';
  process.env.WHATSAPP_CHATSTURN_USE_TEXT = 'false';
  process.env.WHATSAPP_USE_TEMPLATE = 'true';
  process.env.WHATSAPP_MESSAGE_TEMPLATE_VARIABLES = 'otp-1,otp-2';

  const originalPost = require('axios').post;
  require('axios').post = async () => {
    const error = new Error('Request failed with status code 401');
    error.response = {
      status: 401,
      data: { message: 'Unauthenticated.' }
    };
    throw error;
  };

  try {
    const result = await sendOtpMessage('9876543210', '123456');
    assert.equal(result.success, true);
    assert.equal(result.mocked, true);
    assert.equal(result.otp, '123456');
  } finally {
    require('axios').post = originalPost;
    process.env.WHATSAPP_PROVIDER = 'chatsturn';
    process.env.WHATSAPP_MOCK_MODE = 'false';
    process.env.WHATSAPP_FALLBACK_TO_MOCK = 'false';
  }
});

test('mock mode returns a success boolean for OTP delivery', async () => {
  const originalMockMode = process.env.WHATSAPP_MOCK_MODE;
  const originalProvider = process.env.WHATSAPP_PROVIDER;

  process.env.WHATSAPP_MOCK_MODE = 'true';
  process.env.WHATSAPP_PROVIDER = 'mock';

  try {
    const result = await sendOtpMessage('9876543210', '123456');
    assert.equal(result, true);
  } finally {
    process.env.WHATSAPP_MOCK_MODE = originalMockMode;
    process.env.WHATSAPP_PROVIDER = originalProvider;
  }
});
