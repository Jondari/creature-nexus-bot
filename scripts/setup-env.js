#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ENV_SAMPLE_PATH = path.join(__dirname, '..', '.env.sample');
const ENV_PATH = path.join(__dirname, '..', '.env');

function setupEnv() {
  try {
    if (!fs.existsSync(ENV_SAMPLE_PATH)) {
      console.error('Error: .env.sample file not found');
      process.exit(1);
    }

    if (fs.existsSync(ENV_PATH)) {
      console.log('ℹ️  .env file already exists, skipping creation');
      return;
    }

    const envSampleContent = fs.readFileSync(ENV_SAMPLE_PATH, 'utf8');
    const envLines = envSampleContent.split('\n').map(line => {
      const trimmedLine = line.trim();
      
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        return line;
      }

      const [key] = trimmedLine.split('=');
      if (key) {
        const envValue = process.env[key] || '';
        return `${key}=${envValue}`;
      }
      
      return line;
    });

    const envContent = envLines.join('\n');
    fs.writeFileSync(ENV_PATH, envContent);
    
    console.log('✅ Environment file created successfully from .env.sample');
  } catch (error) {
    console.error('Error setting up environment file:', error.message);
    process.exit(1);
  }
}

setupEnv();