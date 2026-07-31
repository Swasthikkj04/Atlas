export interface DeviceMetadata {
  browser: string;
  operatingSystem: string;
  deviceType: string;
  deviceName: string;
  userAgent?: string;
  ipAddress?: string;
}

export function parseUserAgent(
  userAgentHeader?: string,
  clientIp?: string,
): DeviceMetadata {
  const ua = userAgentHeader || '';

  let browser = 'Unknown Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let operatingSystem = 'Unknown OS';
  if (ua.includes('Windows')) operatingSystem = 'Windows';
  else if (ua.includes('Macintosh') || ua.includes('Mac OS')) operatingSystem = 'macOS';
  else if (ua.includes('Linux')) operatingSystem = 'Linux';
  else if (ua.includes('Android')) operatingSystem = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) operatingSystem = 'iOS';

  let deviceType = 'Desktop';
  if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) {
    deviceType = 'Mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    deviceType = 'Tablet';
  }

  const deviceName = `${browser} on ${operatingSystem}`;

  return {
    browser,
    operatingSystem,
    deviceType,
    deviceName,
    userAgent: ua,
    ipAddress: clientIp || '127.0.0.1',
  };
}
