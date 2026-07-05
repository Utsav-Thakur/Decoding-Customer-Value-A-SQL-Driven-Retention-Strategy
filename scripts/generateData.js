import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { engineerFeatures } from '../src/utils/featureEngineering.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple CSV parser
function parseCSV(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) continue;

    const row = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx];
    });
    data.push(row);
  }

  return data;
}

function run() {
  const csvPath = path.join(__dirname, '../Dataset.csv');
  const outDir = path.join(__dirname, '../public/data');
  const outPath = path.join(outDir, 'customer_features.json');

  console.log(`Reading CSV from ${csvPath}...`);
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    process.exit(1);
  }

  const csvText = fs.readFileSync(csvPath, 'utf-8');
  console.log('Parsing CSV...');
  const rawData = parseCSV(csvText);
  console.log(`Parsed ${rawData.length} raw customer records.`);

  console.log('Running feature engineering...');
  const enrichedData = engineerFeatures(rawData);
  console.log(`Enriched ${enrichedData.length} customer records.`);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`Writing JSON to ${outPath}...`);
  fs.writeFileSync(outPath, JSON.stringify(enrichedData, null, 2), 'utf-8');
  console.log('Done!');
}

run();
