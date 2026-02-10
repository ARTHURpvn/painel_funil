/**
 * Script para importar dados do CSV via API do servidor
 * Uso: node scripts/import-csv.mjs /path/to/file.csv
 */

import fs from 'fs';

// Parse the special CSV format
function parseLine(line) {
  line = line.trim();
  if (line.startsWith('"')) line = line.slice(1);
  if (line.endsWith('"')) line = line.slice(0, -1);
  
  // Find date pattern
  const dateMatch = line.match(/""(\d{4}-\d{2}-\d{2})""/);
  if (!dateMatch) return null;
  
  const dateStr = dateMatch[1];
  const datePos = dateMatch.index + dateMatch[0].length;
  
  // Numeric part after date
  let numericPart = line.slice(datePos);
  if (numericPart.startsWith(',')) numericPart = numericPart.slice(1);
  
  const numericValues = numericPart.split(',');
  if (numericValues.length < 5) return null;
  
  // Text part before date
  const textPart = line.slice(0, dateMatch.index);
  const parts = textPart.split(',""');
  
  // Clean up the text fields - remove trailing "" and extra quotes and commas
  const cleanField = (s) => {
    if (!s) return '';
    return s.replace(/""/g, '').replace(/,$/g, '').trim();
  };
  
  return {
    campaign: cleanField(parts[0]),
    prelanding: cleanField(parts[1]),
    landing: cleanField(parts[2]),
    date: dateStr,
    cost: numericValues[0]?.replace(/"/g, '').trim() || '0',
    profit: numericValues[1]?.replace(/"/g, '').trim() || '0',
    roi: numericValues[2]?.replace(/"/g, '').trim() || '0',
    purchase: numericValues[3]?.replace(/"/g, '').trim() || '0',
    initiateCheckoutCPA: numericValues[4]?.replace(/"/g, '').trim() || '0',
  };
}

function parseCSV(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  
  const records = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const parsed = parseLine(line);
    if (parsed) {
      records.push(parsed);
    }
  }
  
  return records;
}

// Convert to CSV format expected by the upload API
function convertToUploadFormat(records) {
  const header = 'Campaign,Prelanding,Landing,Date,Cost,Profit,Total ROI,Purchase,InitiateCheckout CPA';
  const lines = [header];
  
  for (const r of records) {
    // Escape quotes in fields
    const escapeField = (s) => {
      if (!s) return '';
      return s.replace(/"/g, "'");
    };
    
    const line = [
      `"${escapeField(r.campaign)}"`,
      `"${escapeField(r.prelanding)}"`,
      `"${escapeField(r.landing)}"`,
      `"${r.date}"`,
      r.cost,
      r.profit,
      r.roi,
      r.purchase,
      r.initiateCheckoutCPA,
    ].join(',');
    lines.push(line);
  }
  
  return lines.join('\n');
}

async function main() {
  const filepath = process.argv[2] || '/home/ubuntu/upload/Dados26-12a19-01.csv';
  
  console.log(`Parsing ${filepath}...`);
  const records = parseCSV(filepath);
  console.log(`Found ${records.length} records`);
  
  if (records.length > 0) {
    console.log('\nSample records:');
    for (const r of records.slice(0, 3)) {
      console.log(`  ${r.date}: ${r.campaign.slice(0, 50)}... Cost: ${r.cost}`);
    }
    
    // Convert and save
    const csvContent = convertToUploadFormat(records);
    const outputPath = '/home/ubuntu/upload/formatted-data.csv';
    fs.writeFileSync(outputPath, csvContent);
    console.log(`\nFormatted CSV saved to ${outputPath}`);
    console.log(`Total records: ${records.length}`);
  }
}

main().catch(console.error);
