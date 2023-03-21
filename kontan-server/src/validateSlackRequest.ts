import * as crypto from 'crypto';

export const validateSlackRequest = (request: Request) => {
  const slackAppSigningSecret = process.env.SLACK_SIGNING_SECRET as string;
  const requestBody = request.body;
  const timestamp = Number(request.headers['x-slack-request-timestamp']);

  // verify that the timestamp does not differ from local time by more than
  // five minutes
  if (
    !timestamp ||
    Math.abs(Math.floor(new Date().getTime() / 1000) - timestamp) > 60 * 5
  ) {
    return false;
  }

  // compute the basestring
  const baseStr = `v0:${timestamp}:${requestBody}`;

  // extract the received signature from the request headers
  const receivedSignature = request.headers['x-slack-signature'] as string;

  // compute the signature using the basestring
  // and hashing it using the signing secret
  // which can be stored as a environment variable
  const expectedSignature = `v0=${crypto
    .createHmac('sha256', slackAppSigningSecret)
    .update(baseStr, 'utf8')
    .digest('hex')}`;

  // match the two signatures
  if (
    crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(receivedSignature),
    )
  ) {
    return true;
  }

  console.log('WEBHOOK SIGNATURE MISMATCH');
  return false;
};
