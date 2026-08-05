const test = require('node:test');
const assert = require('node:assert/strict');
const axios = require('axios');

process.env.NODE_ENV = 'development';
process.env.WHATSAPP_MOCK_MODE = 'false';
process.env.WHATSAPP_PHONE_NUMBER_ID = '1154914131048872';
process.env.WHATSAPP_ACCESS_TOKEN = 'graph-access-token';
process.env.WHATSAPP_API_KEY = '22538|demo-api-key';
process.env.WHATSAPP_TEMPLATE_ID = '420492';

const { sendOtpMessage } = require('../src/services/whatsappService');

test('uses the ChatTurn template endpoint and template variable fields when the configured API key is the provider token', async () => {
  let postCalls = 0;
  const originalPost = axios.post;
  axios.post = async (url, data, config) => {
    postCalls += 1;

    assert.equal(url, 'https://api.chatsturn.com/api/v1/whatsapp/send/template');
    assert.equal(config.headers['Content-Type'], 'application/x-www-form-urlencoded');

    const payload = data.toString();
    assert.match(payload, /apiToken=22538\|demo-api-key/);
    assert.match(payload, /phone_number_id=1154914131048872/);
    assert.match(payload, /template_id=420492/);
    assert.match(payload, /templateVariable-otp-1=1/);
    assert.match(payload, /templateVariable-otp-2=2/);
    assert.match(payload, /templateVariable-otp-3=3/);
    assert.match(payload, /templateVariable-otp-4=4/);
    assert.match(payload, /templateVariable-otp-5=5/);
    assert.match(payload, /templateVariable-otp-6=6/);

    return {
      data: {
        status: 'success',
        message: 'sent'
      }
    };
  };

  try {
    const result = await sendOtpMessage('9876543210', '123456');

    assert.equal(result.success, true);
    assert.equal(result.mocked, false);
    assert.equal(postCalls, 1);
  } finally {
    axios.post = originalPost;
  }
});

test('falls back to a local mock OTP when only an API key is configured', async () => {
  let postCalls = 0;
  const originalPost = axios.post;
  axios.post = async () => {
    postCalls += 1;
    throw { response: { status: 401, data: { error: { code: 190 } } } };
  };

  try {
    const result = await sendOtpMessage('9876543210', '123456');

    assert.equal(result.success, true);
    assert.equal(result.mocked, true);
    assert.equal(postCalls, 1);
  } finally {
    axios.post = originalPost;
  }
});
