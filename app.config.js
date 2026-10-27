const callPushEnvironment = process.env.EXPO_PUBLIC_APNS_ENVIRONMENT || 'sandbox';
if (!['sandbox', 'production'].includes(callPushEnvironment)) throw new Error('EXPO_PUBLIC_APNS_ENVIRONMENT must be sandbox or production');

module.exports = ({ config }) => ({
  ...config,
  extra: { ...config.extra, callPushEnvironment },
});
