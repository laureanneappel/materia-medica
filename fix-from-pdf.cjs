#!/usr/bin/env node
/**
 * AUTOMATED FIX SCRIPT - 100% PDF Match
 *
 * Automatically corrects database to match egenskaber.pdf exactly
 * Based on verification report from verify-against-pdf.cjs
 */

const fs = require('fs');
const path = require('path');

// Load all data files
const pdfData = require('./PDF-PROPERTIES-TO-PLANTS.json');
const translations = require('./DANISH-TO-ENGLISH-PROPERTIES.json');
const nameCorrections = require('./PDF-NAME-CORRECTIONS.json');
const plantsDataPath = path.join(__dirname, 'plants-data.js');
const plantsDataContent = fs.readFileSync(plantsDataPath, 'utf8');
const plantsData = JSON.parse(plantsDataContent.replace('window.PLANTS_DATA = ', '').replace(/;[\s\S]*$/, ''));

console.log('='.repeat(80));
console.log('AUTOMATED PDF FIX SCRIPT');
console.log('='.repeat(80));
console.log('\nThis will modify plants-data.js to match egenskaber.pdf exactly.\n');

let changeCount = 0;

// Build expected database from PDF
const expectedDB = {};

for (const [danishProp, latinPlants] of Object.entries(pdfData)) {
  const englishProp = translations[danishProp];

  if (!englishProp) {
    console.log(`⚠️  Skipping untranslated property: "${danishProp}"`);
    continue;
  }

  for (const latinName of latinPlants) {
    // Skip non-botanical entries
    if (latinName === 'Citrus kerne ekstrakt' || latinName === 'Citruskerneekstrakt') {
      continue;
    }

    // Correct PDF typos to match database botanical names
    const correctedName = nameCorrections[latinName] || latinName;

    if (!expectedDB[correctedName]) {
      expectedDB[correctedName] = [];
    }

    if (!expectedDB[correctedName].includes(englishProp)) {
      expectedDB[correctedName].push(englishProp);
    }
  }
}

const expectedEnabledPlants = Object.keys(expectedDB).sort();

console.log('═'.repeat(80));
console.log('STEP 1: DISABLE PLANTS NOT IN PDF');
console.log('═'.repeat(80));
console.log('');

for (const plant of plantsData) {
  if (plant.status === 'enabled' && !expectedEnabledPlants.includes(plant.botanicalName)) {
    console.log(`❌ DISABLING: ${plant.botanicalName} (not in PDF)`);
    plant.status = 'disabled';
    plant.properties = [];
    changeCount++;
  }
}

console.log('');
console.log('═'.repeat(80));
console.log('STEP 2: ENABLE PLANTS FROM PDF');
console.log('═'.repeat(80));
console.log('');

for (const latinName of expectedEnabledPlants) {
  const plant = plantsData.find(p => p.botanicalName === latinName);

  if (!plant) {
    console.log(`⚠️  PLANT NOT FOUND IN DATABASE: ${latinName}`);
    console.log(`    This plant exists in PDF but not in database - manual addition needed`);
  } else if (plant.status !== 'enabled') {
    console.log(`✅ ENABLING: ${latinName}`);
    plant.status = 'enabled';
    // Properties will be set in next step
    changeCount++;
  }
}

console.log('');
console.log('═'.repeat(80));
console.log('STEP 3: CORRECT ALL PROPERTIES');
console.log('═'.repeat(80));
console.log('');

for (const [latinName, expectedProps] of Object.entries(expectedDB)) {
  const plant = plantsData.find(p => p.botanicalName === latinName);

  if (!plant || plant.status !== 'enabled') {
    continue;
  }

  const currentProps = plant.properties || [];
  const expectedSorted = [...expectedProps].sort();
  const currentSorted = [...currentProps].sort();

  // Check if properties match
  const propsMatch = JSON.stringify(expectedSorted) === JSON.stringify(currentSorted);

  if (!propsMatch) {
    const missing = expectedSorted.filter(prop => !currentSorted.includes(prop));
    const extra = currentSorted.filter(prop => !expectedSorted.includes(prop));

    console.log(`🔧 FIXING: ${latinName}`);
    if (missing.length > 0) {
      console.log(`   Adding ${missing.length} properties:`, missing.join(', '));
    }
    if (extra.length > 0) {
      console.log(`   Removing ${extra.length} properties:`, extra.join(', '));
    }

    // Replace properties with exact PDF properties
    plant.properties = expectedSorted;
    changeCount++;
  }
}

console.log('');
console.log('═'.repeat(80));
console.log('STEP 4: SAVE CHANGES');
console.log('═'.repeat(80));
console.log('');

if (changeCount === 0) {
  console.log('✅ No changes needed - database already matches PDF 100%');
} else {
  // Write back to file
  const updatedContent = `window.PLANTS_DATA = ${JSON.stringify(plantsData, null, 2)};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PLANTS_DATA;
}
`;

  fs.writeFileSync(plantsDataPath, updatedContent, 'utf8');

  console.log(`✅ SUCCESS: ${changeCount} changes applied to plants-data.js`);
  console.log('');
  console.log('📋 Next step: Run verify-against-pdf.cjs to confirm 100% match');
}

console.log('');
console.log('═'.repeat(80));
