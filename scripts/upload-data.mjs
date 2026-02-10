/**
 * Script para fazer upload dos dados via API tRPC
 */

import fs from 'fs';

async function uploadData() {
  const csvPath = '/home/ubuntu/upload/formatted-data.csv';
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  
  console.log(`CSV content length: ${csvContent.length} characters`);
  console.log(`First 500 chars: ${csvContent.slice(0, 500)}`);
  
  const payload = {
    json: {
      csvContent: csvContent,
      replaceExisting: true,
    }
  };
  
  console.log('\nSending upload request...');
  
  try {
    const response = await fetch('http://localhost:3000/api/trpc/funnel.upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const result = await response.json();
    console.log('\nResponse:', JSON.stringify(result, null, 2));
    
    if (result.result?.data?.json?.success) {
      console.log('\n✅ Upload successful!');
      console.log(`Records imported: ${result.result.data.json.recordsImported}`);
    } else {
      console.log('\n❌ Upload failed');
      console.log('Message:', result.result?.data?.json?.message || result.error?.message);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

uploadData();
