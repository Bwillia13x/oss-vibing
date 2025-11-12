// Simple script to create placeholder PWA icons
const fs = require('fs');

// Create a simple SVG that we'll reference
const svgIcon = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#000000"/>
  <text x="256" y="280" font-size="200" fill="#ffffff" text-anchor="middle" font-family="Arial">VU</text>
</svg>`;

fs.writeFileSync('icon.svg', svgIcon);
console.log('Created icon.svg - Use this to generate PNG icons at 192x192 and 512x512');
