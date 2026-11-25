const assert = require('node:assert/strict');
const { after, test } = require('node:test');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const pool = require('../src/config/db');

const originalGetConnection = pool.getConnection;
const originalVerifyIdToken = OAuth2Client.prototype.verifyIdToken;
const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalJwtSecret = process.env.JWT_SECRET;
let googlePayload;
let users;
let insertParameters;
let releaseCount;
let verifiedAudience;

process.env.GOOGLE_CLIENT_ID = 'test-web-client-id';
process.env.JWT_SECRET = 'test-jwt-secret';
OAuth2Client.prototype.verifyIdToken = async ({ idToken, audience }) => {
  assert.equal(idToken, 'test-google-id-token');
  verifiedAudience = audience;
  return { getPayload: () => googlePayload };
};

pool.getConnection = async () => ({
  async query(sql, parameters) {
    if (sql.startsWith('SELECT * FROM users')) {
      return [users, []];
    }
    if (sql.startsWith('INSERT INTO users')) {
      insertParameters = parameters;
      return [{ affectedRows: 1 }, []];
    }
    throw new Error(`Unexpected Google-login query: ${sql}`);
  },
  release() {
    releaseCount += 1;
  }
});

after(() => {
  pool.getConnection = originalGetConnection;
  OAuth2Client.prototype.verifyIdToken = originalVerifyIdToken;
  if (originalClientId === undefined) {
    delete process.env.GOOGLE_CLIENT_ID;
  } else {
    process.env.GOOGLE_CLIENT_ID = originalClientId;
  }
  if (originalJwtSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalJwtSecret;
  }
});

const { googleLogin } = require('../src/controllers/authController');

function createResponse() {
  return {
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    }
  };
}

function prepareRequestState(initialUsers) {
  users = initialUsers;
  insertParameters = undefined;
  releaseCount = 0;
  verifiedAudience = undefined;
  googlePayload = {
    email: 'shopper@example.com',
    email_verified: true,
    name: 'Google Shopper'
  };
}

test('rejects Google login when the server client ID is missing', async () => {
  delete process.env.GOOGLE_CLIENT_ID;
  const response = createResponse();

  await googleLogin({ body: { credential: 'test-google-id-token' } }, response);

  assert.equal(response.statusCode, 503);
  assert.match(response.body.message, /GOOGLE_CLIENT_ID/);
  process.env.GOOGLE_CLIENT_ID = 'test-web-client-id';
});

test('creates a new user and issues a JWT for a verified Google ID token', async () => {
  prepareRequestState([]);
  const response = createResponse();

  await googleLogin({ body: { credential: 'test-google-id-token' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(verifiedAudience, 'test-web-client-id');
  assert.equal(insertParameters[1], 'Google Shopper');
  assert.equal(insertParameters[2], 'shopper@example.com');
  assert.equal(response.body.user.email, 'shopper@example.com');
  assert.equal(jwt.decode(response.body.token).email, 'shopper@example.com');
  assert.equal(releaseCount, 1);
});

test('logs in an existing active user without creating a duplicate and issues a JWT', async () => {
  prepareRequestState([{
    user_id: 'existing-user-id',
    username: 'Existing Shopper',
    email: 'shopper@example.com',
    phone: '1234567890',
    role: 'user',
    status: 'active'
  }]);
  const response = createResponse();

  await googleLogin({ body: { credential: 'test-google-id-token' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(insertParameters, undefined);
  assert.equal(response.body.user.user_id, 'existing-user-id');
  assert.equal(jwt.decode(response.body.token).user_id, 'existing-user-id');
  assert.equal(releaseCount, 1);
});

test('rejects an unverified Google email before accessing the user database', async () => {
  prepareRequestState([]);
  googlePayload.email_verified = false;
  const response = createResponse();

  await googleLogin({ body: { credential: 'test-google-id-token' } }, response);

  assert.equal(response.statusCode, 401);
  assert.match(response.body.message, /verified email/);
  assert.equal(releaseCount, 0);
});
