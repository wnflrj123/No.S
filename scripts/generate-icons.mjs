import sharp from 'sharp';
import { readFileSync } from 'fs';

// 일반 아이콘 SVG (3D 느낌, 밝은 배경 + 로고)
const iconSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f7ff"/>
      <stop offset="50%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e8f2ff"/>
    </linearGradient>
    <linearGradient id="sphereBlue" x1="30%" y1="20%" x2="80%" y2="90%">
      <stop offset="0%" style="stop-color:#a5d4ff"/>
      <stop offset="50%" style="stop-color:#3182f6"/>
      <stop offset="100%" style="stop-color:#1b64da"/>
    </linearGradient>
    <linearGradient id="spherePurple" x1="30%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" style="stop-color:#c9a5ff"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <linearGradient id="sphereCyan" x1="20%" y1="20%" x2="80%" y2="80%">
      <stop offset="0%" style="stop-color:#7dd3fc"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <radialGradient id="shine" cx="35%" cy="30%" r="60%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.7"/>
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
    </radialGradient>
    <filter id="logoShadow" x="-15%" y="-15%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#3182f6" flood-opacity="0.25"/>
    </filter>
    <filter id="sphereShadow" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#191f28" flood-opacity="0.15"/>
    </filter>
    <filter id="smallShadow" x="-40%" y="-30%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#191f28" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="108" fill="url(#bg)"/>

  <!-- Subtle grid dots for depth -->
  <circle cx="80" cy="80" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="160" cy="80" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="80" cy="160" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="432" cy="352" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="432" cy="432" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="352" cy="432" r="2" fill="#3182f6" opacity="0.08"/>

  <!-- 3D Sphere - top right (large) -->
  <g filter="url(#sphereShadow)">
    <circle cx="408" cy="100" r="42" fill="url(#sphereBlue)"/>
    <circle cx="408" cy="100" r="42" fill="url(#shine)"/>
  </g>

  <!-- 3D Sphere - bottom left (medium, purple) -->
  <g filter="url(#smallShadow)">
    <circle cx="95" cy="400" r="30" fill="url(#spherePurple)"/>
    <circle cx="95" cy="400" r="30" fill="url(#shine)"/>
  </g>

  <!-- 3D Sphere - top left tiny -->
  <g filter="url(#smallShadow)">
    <circle cx="120" cy="115" r="14" fill="url(#sphereCyan)"/>
    <circle cx="120" cy="115" r="14" fill="url(#shine)"/>
  </g>

  <!-- 3D Sphere - bottom right tiny -->
  <circle cx="420" cy="410" r="10" fill="#3182f6" opacity="0.2"/>

  <!-- Soft ring decoration -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="#3182f6" stroke-width="1" opacity="0.06"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#3182f6" stroke-width="1" opacity="0.04"/>

  <!-- Logo centered with shadow -->
  <g filter="url(#logoShadow)" transform="translate(256, 256) scale(1.75) translate(-80, -80)">
    <path fill="#0066B3" d="M144.36,47.16c-2.18-2.46-5.95-2.68-8.41-.5-2.66,2.36-6.3,4.02-10.16,5.19-2.26.63-4.56,1.1-6.88,1.46,2.59-9.25,5.21-18.5,7.95-27.74,1.45-4.7-1.85-9.74-6.75-10.26-4.4-.52-8.38,2.63-8.9,7.03-1.34,10.61-2.84,21.22-4.58,31.77-6.09-.11-12.21-.92-18.18-2.15.2-3.12.4-6.25.54-9.42.02-5.97,1.44-19.95-8.03-19.34-5.95,1-9.4,9.54-12.1,14.19-1.34,2.76-2.63,5.55-3.88,8.34-8.54-1.98-17.34-2.8-24.93.88-2.87,1.48-5.48,4.28-6.67,7.28-2.53,6.64-1.36,14.63,5.29,18.41,4.22,2.42,9.3,3.36,14.28,3.76-1.14,3.3-2.24,6.62-3.29,9.95-1.91-.05-3.83-.03-5.74.07-8.89.53-17.86,1.68-26.42,4.11-8.12,4.33-2.31,16.14,6.04,12.44,7.39-3.65,15.29-6.4,23.42-7.73-3.11,10.62-5.83,21.37-8.21,32.22-.86,3.91,1.85,7.79,5.82,8.32,3.79.52,7.29-2.14,7.8-5.93,1.63-11.89,4-23.74,6.88-35.48,6.64.25,13,2.17,19.03,4.95-.16,1.86-.31,3.72-.44,5.59-.49,7.22-.99,14.13-.37,21.52.32,2.83.69,5.63,2.12,8.33,2,4.02,7.09,5.66,10.9,3.36,4.57-2.9,6-6.94,7.94-11.31,1.9-4.61,2.99-9.35,4.04-14.1,3.03,1.29,6.17,2.22,9.44,2.52,12.48,1.53,23.48-7.51,21.18-20.59-1.94-10-9.66-17.62-18.54-21.26-.34-.13-.69-.24-1.03-.36,1.08-3.87,2.17-7.74,3.25-11.61,8.55.07,16.96-.74,25.23-4.35,3.85-1.38,5.17-6.52,2.38-9.55ZM45.57,46.65c0,1.48,1.2,2.68,2.68,2.68-1.48,0-2.68,1.2-2.68,2.68,0-1.48-1.2-2.68-2.68-2.68,1.48,0,2.68-1.2,2.68-2.68ZM37.83,58.55c0-1.48-1.2-2.68-2.68-2.68,1.48,0,2.68-1.2,2.68-2.68,0,1.48,1.2,2.68,2.68,2.68-1.48,0-2.68,1.2-2.68,2.68ZM39.89,52.32c.93,0,1.68-.75,1.68-1.68,0,.93.75,1.68,1.68,1.68-.93,0-1.68.75-1.68,1.68,0-.93-.75-1.68-1.68-1.68ZM55.37,69.26c-4.38-.46-8.64-1.45-12.19-3.79-2.81-2.03-2.17-5.04-1.1-7.96.32-.54.64-.97,1.03-1.32,3.4-2.92,11.19-3.2,18.46-2.7-2.2,5.21-4.26,10.47-6.21,15.77ZM78.96,91.14c-3.31-1.09-6.68-2.04-10.11-2.73-2.58-.54-5.19-1-7.82-1.39.94-3.53,1.91-7.06,2.93-10.57.36,0,.71.02,1.06.03,5.05.46,10.12.83,15.17,1.18-.38,4.49-.81,8.98-1.22,13.47ZM80.75,70.47c-4.95-.07-9.87-.27-14.8-.65,1.61-5.16,3.35-10.27,5.29-15.29.99.14,1.89.27,2.68.39,2.5.51,5,1.03,7.49,1.55-.09,4.67-.33,9.33-.66,14ZM73.84,48.12c.96-2.25,1.97-4.48,3.04-6.69,1.06-2.12,2.21-4.39,3.58-6.41.39,2.5.53,5.13.72,7.59.15,2.57.24,5.13.26,7.7-2.42-.66-4.97-1.42-7.61-2.19ZM89.21,128.64c.2.25.14.3,0,0h0ZM92.14,112.92c-1.46,3.17-2.8,6.37-4.3,9.44-.29-2.44-.42-4.97-.6-7.36-.19-3.35-.3-6.76-.36-10.17,0-.41,0-.82-.01-1.24.43.26.86.52,1.29.79,1.97,1.19,4,2.47,6.08,3.71-.67,1.63-1.39,3.25-2.11,4.84ZM97.34,98.49c-1.66-.7-3.34-1.43-5.04-2.16-1.79-.78-3.62-1.55-5.46-2.29.04-5.29.16-10.58.33-15.88.59.04,1.19.08,1.78.12,4.2.41,8.63.6,12.86,1.31-1.36,6.33-2.84,12.63-4.48,18.9ZM89.2,70.48c-.58,0-1.16,0-1.74,0,.1-2.34.2-4.68.31-7.02.09-1.89.19-3.77.31-5.66,5.78,1.12,11.57,2.1,17.46,2.67-.6,3.41-1.23,6.81-1.89,10.2-4.8-.4-9.59-.19-14.44-.2ZM114.46,84.86c7.38,5.62,12.04,18.32-1.74,17.87-2.32.01-4.84-.49-7.48-1.29,1.89-6.35,3.72-12.7,5.52-19.06,1.3.68,2.54,1.49,3.69,2.47Z"/>
    <path fill="#0066B3" d="M128.22,122.22c-6.64-.51-10.63,7.13-6.43,12.3,4.16,4.6,12.54,3.19,13.57-3.45.98-4.68-2.47-8.63-7.14-8.85ZM123.56,129.71c.83-3.86,6.46-2.78,6.61.76.21,5.01-7.79,4.13-6.61-.76Z"/>
  </g>
</svg>
`;

// Maskable 아이콘 (패딩 추가, 둥근 배경 없이 전체 채움)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#f0f7ff"/>
      <stop offset="50%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e8f2ff"/>
    </linearGradient>
    <linearGradient id="sphereBlue" x1="30%" y1="20%" x2="80%" y2="90%">
      <stop offset="0%" style="stop-color:#a5d4ff"/>
      <stop offset="50%" style="stop-color:#3182f6"/>
      <stop offset="100%" style="stop-color:#1b64da"/>
    </linearGradient>
    <linearGradient id="spherePurple" x1="30%" y1="10%" x2="80%" y2="90%">
      <stop offset="0%" style="stop-color:#c9a5ff"/>
      <stop offset="100%" style="stop-color:#8b5cf6"/>
    </linearGradient>
    <linearGradient id="sphereCyan" x1="20%" y1="20%" x2="80%" y2="80%">
      <stop offset="0%" style="stop-color:#7dd3fc"/>
      <stop offset="100%" style="stop-color:#3b82f6"/>
    </linearGradient>
    <radialGradient id="shine" cx="35%" cy="30%" r="60%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.7"/>
      <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0"/>
    </radialGradient>
    <filter id="logoShadow" x="-15%" y="-15%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#3182f6" flood-opacity="0.25"/>
    </filter>
    <filter id="sphereShadow" x="-30%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#191f28" flood-opacity="0.15"/>
    </filter>
    <filter id="smallShadow" x="-40%" y="-30%" width="180%" height="180%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#191f28" flood-opacity="0.12"/>
    </filter>
  </defs>

  <!-- Full background (no rounded corners for maskable) -->
  <rect width="512" height="512" fill="url(#bg)"/>

  <!-- Decorative dots -->
  <circle cx="100" cy="100" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="412" cy="100" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="100" cy="412" r="2" fill="#3182f6" opacity="0.08"/>
  <circle cx="412" cy="412" r="2" fill="#3182f6" opacity="0.08"/>

  <!-- 3D Sphere - top right -->
  <g filter="url(#sphereShadow)">
    <circle cx="390" cy="120" r="36" fill="url(#sphereBlue)"/>
    <circle cx="390" cy="120" r="36" fill="url(#shine)"/>
  </g>

  <!-- 3D Sphere - bottom left (purple) -->
  <g filter="url(#smallShadow)">
    <circle cx="115" cy="385" r="26" fill="url(#spherePurple)"/>
    <circle cx="115" cy="385" r="26" fill="url(#shine)"/>
  </g>

  <!-- Tiny sphere -->
  <g filter="url(#smallShadow)">
    <circle cx="135" cy="135" r="12" fill="url(#sphereCyan)"/>
    <circle cx="135" cy="135" r="12" fill="url(#shine)"/>
  </g>

  <!-- Soft rings -->
  <circle cx="256" cy="256" r="160" fill="none" stroke="#3182f6" stroke-width="1" opacity="0.06"/>

  <!-- Logo (slightly smaller for safe zone) -->
  <g filter="url(#logoShadow)" transform="translate(256, 256) scale(1.55) translate(-80, -80)">
    <path fill="#0066B3" d="M144.36,47.16c-2.18-2.46-5.95-2.68-8.41-.5-2.66,2.36-6.3,4.02-10.16,5.19-2.26.63-4.56,1.1-6.88,1.46,2.59-9.25,5.21-18.5,7.95-27.74,1.45-4.7-1.85-9.74-6.75-10.26-4.4-.52-8.38,2.63-8.9,7.03-1.34,10.61-2.84,21.22-4.58,31.77-6.09-.11-12.21-.92-18.18-2.15.2-3.12.4-6.25.54-9.42.02-5.97,1.44-19.95-8.03-19.34-5.95,1-9.4,9.54-12.1,14.19-1.34,2.76-2.63,5.55-3.88,8.34-8.54-1.98-17.34-2.8-24.93.88-2.87,1.48-5.48,4.28-6.67,7.28-2.53,6.64-1.36,14.63,5.29,18.41,4.22,2.42,9.3,3.36,14.28,3.76-1.14,3.3-2.24,6.62-3.29,9.95-1.91-.05-3.83-.03-5.74.07-8.89.53-17.86,1.68-26.42,4.11-8.12,4.33-2.31,16.14,6.04,12.44,7.39-3.65,15.29-6.4,23.42-7.73-3.11,10.62-5.83,21.37-8.21,32.22-.86,3.91,1.85,7.79,5.82,8.32,3.79.52,7.29-2.14,7.8-5.93,1.63-11.89,4-23.74,6.88-35.48,6.64.25,13,2.17,19.03,4.95-.16,1.86-.31,3.72-.44,5.59-.49,7.22-.99,14.13-.37,21.52.32,2.83.69,5.63,2.12,8.33,2,4.02,7.09,5.66,10.9,3.36,4.57-2.9,6-6.94,7.94-11.31,1.9-4.61,2.99-9.35,4.04-14.1,3.03,1.29,6.17,2.22,9.44,2.52,12.48,1.53,23.48-7.51,21.18-20.59-1.94-10-9.66-17.62-18.54-21.26-.34-.13-.69-.24-1.03-.36,1.08-3.87,2.17-7.74,3.25-11.61,8.55.07,16.96-.74,25.23-4.35,3.85-1.38,5.17-6.52,2.38-9.55ZM45.57,46.65c0,1.48,1.2,2.68,2.68,2.68-1.48,0-2.68,1.2-2.68,2.68,0-1.48-1.2-2.68-2.68-2.68,1.48,0,2.68-1.2,2.68-2.68ZM37.83,58.55c0-1.48-1.2-2.68-2.68-2.68,1.48,0,2.68-1.2,2.68-2.68,0,1.48,1.2,2.68,2.68,2.68-1.48,0-2.68,1.2-2.68,2.68ZM39.89,52.32c.93,0,1.68-.75,1.68-1.68,0,.93.75,1.68,1.68,1.68-.93,0-1.68.75-1.68,1.68,0-.93-.75-1.68-1.68-1.68ZM55.37,69.26c-4.38-.46-8.64-1.45-12.19-3.79-2.81-2.03-2.17-5.04-1.1-7.96.32-.54.64-.97,1.03-1.32,3.4-2.92,11.19-3.2,18.46-2.7-2.2,5.21-4.26,10.47-6.21,15.77ZM78.96,91.14c-3.31-1.09-6.68-2.04-10.11-2.73-2.58-.54-5.19-1-7.82-1.39.94-3.53,1.91-7.06,2.93-10.57.36,0,.71.02,1.06.03,5.05.46,10.12.83,15.17,1.18-.38,4.49-.81,8.98-1.22,13.47ZM80.75,70.47c-4.95-.07-9.87-.27-14.8-.65,1.61-5.16,3.35-10.27,5.29-15.29.99.14,1.89.27,2.68.39,2.5.51,5,1.03,7.49,1.55-.09,4.67-.33,9.33-.66,14ZM73.84,48.12c.96-2.25,1.97-4.48,3.04-6.69,1.06-2.12,2.21-4.39,3.58-6.41.39,2.5.53,5.13.72,7.59.15,2.57.24,5.13.26,7.7-2.42-.66-4.97-1.42-7.61-2.19ZM89.21,128.64c.2.25.14.3,0,0h0ZM92.14,112.92c-1.46,3.17-2.8,6.37-4.3,9.44-.29-2.44-.42-4.97-.6-7.36-.19-3.35-.3-6.76-.36-10.17,0-.41,0-.82-.01-1.24.43.26.86.52,1.29.79,1.97,1.19,4,2.47,6.08,3.71-.67,1.63-1.39,3.25-2.11,4.84ZM97.34,98.49c-1.66-.7-3.34-1.43-5.04-2.16-1.79-.78-3.62-1.55-5.46-2.29.04-5.29.16-10.58.33-15.88.59.04,1.19.08,1.78.12,4.2.41,8.63.6,12.86,1.31-1.36,6.33-2.84,12.63-4.48,18.9ZM89.2,70.48c-.58,0-1.16,0-1.74,0,.1-2.34.2-4.68.31-7.02.09-1.89.19-3.77.31-5.66,5.78,1.12,11.57,2.1,17.46,2.67-.6,3.41-1.23,6.81-1.89,10.2-4.8-.4-9.59-.19-14.44-.2ZM114.46,84.86c7.38,5.62,12.04,18.32-1.74,17.87-2.32.01-4.84-.49-7.48-1.29,1.89-6.35,3.72-12.7,5.52-19.06,1.3.68,2.54,1.49,3.69,2.47Z"/>
    <path fill="#0066B3" d="M128.22,122.22c-6.64-.51-10.63,7.13-6.43,12.3,4.16,4.6,12.54,3.19,13.57-3.45.98-4.68-2.47-8.63-7.14-8.85ZM123.56,129.71c.83-3.86,6.46-2.78,6.61.76.21,5.01-7.79,4.13-6.61-.76Z"/>
  </g>
</svg>
`;

async function generate() {
  const sizes = [192, 512];

  for (const size of sizes) {
    // 일반 아이콘
    await sharp(Buffer.from(iconSvg))
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}.png`);
    console.log(`Generated icon-${size}.png`);

    // Maskable 아이콘
    await sharp(Buffer.from(maskableSvg))
      .resize(size, size)
      .png()
      .toFile(`public/icon-${size}-maskable.png`);
    console.log(`Generated icon-${size}-maskable.png`);
  }

  // Apple touch icon (180x180)
  await sharp(Buffer.from(iconSvg))
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
  console.log('Generated apple-touch-icon.png');

  console.log('All icons generated!');
}

generate().catch(console.error);
