#!/usr/bin/env node
/**
 * COMPREHENSIVE PDF VERIFICATION SCRIPT
 *
 * Verifies database matches egenskaber.pdf 100%
 * Uses Danish property names and Latin botanical names as source of truth
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
console.log('COMPREHENSIVE PDF VERIFICATION');
console.log('='.repeat(80));
console.log('\nSource of Truth: egenskaber.pdf');
console.log('  - Danish property names → English translations');
console.log('  - Latin botanical names (exact spelling)');
console.log('');

// Build expected database from PDF
const expectedDB = {};

for (const [danishProp, latinPlants] of Object.entries(pdfData)) {
  const englishProp = translations[danishProp];

  if (!englishProp) {
    console.log(`⚠️  WARNING: No English translation for Danish property: "${danishProp}"`);
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

// Get all Latin names that should be enabled
const expectedEnabledPlants = Object.keys(expectedDB).sort();

console.log(`Expected enabled plants from PDF: ${expectedEnabledPlants.length}`);
console.log('');

// Analyze current database
const currentDB = {};
const currentEnabledPlants = [];

for (const plant of plantsData) {
  if (plant.status === 'enabled') {
    currentEnabledPlants.push(plant.botanicalName);
    currentDB[plant.botanicalName] = plant.properties || [];
  }
}

console.log(`Current enabled plants in DB: ${currentEnabledPlants.length}`);
console.log('');

// VERIFICATION 1: Plant Status (Enabled/Disabled)
console.log('═'.repeat(80));
console.log('VERIFICATION 1: PLANT STATUS');
console.log('═'.repeat(80));
console.log('');

const shouldBeEnabled = expectedEnabledPlants.filter(name => !currentEnabledPlants.includes(name));
const shouldBeDisabled = currentEnabledPlants.filter(name => !expectedEnabledPlants.includes(name));

if (shouldBeEnabled.length === 0 && shouldBeDisabled.length === 0) {
  console.log('✅ PERFECT: All plant statuses match PDF');
} else {
  console.log(`❌ MISMATCHES FOUND: ${shouldBeEnabled.length + shouldBeDisabled.length} issues`);

  if (shouldBeDisabled.length > 0) {
    console.log(`\n🔴 Plants ENABLED in DB but NOT in PDF (${shouldBeDisabled.length}):`);
    console.log('    These should be DISABLED:');
    shouldBeDisabled.forEach(name => console.log(`      - ${name}`));
  }

  if (shouldBeEnabled.length > 0) {
    console.log(`\n🟡 Plants in PDF but NOT ENABLED in DB (${shouldBeEnabled.length}):`);
    console.log('    These should be ENABLED (need properties added):');
    shouldBeEnabled.forEach(name => console.log(`      - ${name}`));
  }
}

console.log('');

// VERIFICATION 2: Property Accuracy for Each Plant
console.log('═'.repeat(80));
console.log('VERIFICATION 2: PROPERTY ACCURACY');
console.log('═'.repeat(80));
console.log('');

let totalPropertyIssues = 0;
const propertyErrors = [];

for (const [latinName, expectedProps] of Object.entries(expectedDB)) {
  const currentProps = currentDB[latinName] || [];

  // Sort for comparison
  const expectedSorted = [...expectedProps].sort();
  const currentSorted = [...currentProps].sort();

  // Find missing properties
  const missing = expectedSorted.filter(prop => !currentSorted.includes(prop));

  // Find extra properties
  const extra = currentSorted.filter(prop => !expectedSorted.includes(prop));

  if (missing.length > 0 || extra.length > 0) {
    totalPropertyIssues++;
    propertyErrors.push({
      plant: latinName,
      missing,
      extra,
      expected: expectedProps.length,
      current: currentProps.length
    });
  }
}

if (totalPropertyIssues === 0) {
  console.log('✅ PERFECT: All properties match PDF for all enabled plants');
} else {
  console.log(`❌ PROPERTY MISMATCHES: ${totalPropertyIssues} plants have incorrect properties\n`);

  // Show detailed errors
  propertyErrors.forEach(error => {
    console.log(`\n🔴 ${error.plant}`);
    console.log(`   Expected: ${error.expected} properties | Current: ${error.current} properties`);

    if (error.missing.length > 0) {
      console.log(`   MISSING (${error.missing.length}):`);
      error.missing.forEach(prop => console.log(`      + ${prop}`));
    }

    if (error.extra.length > 0) {
      console.log(`   EXTRA/INCORRECT (${error.extra.length}):`);
      error.extra.forEach(prop => console.log(`      - ${prop}`));
    }
  });
}

console.log('');

// FINAL SUMMARY
console.log('═'.repeat(80));
console.log('FINAL SUMMARY');
console.log('═'.repeat(80));
console.log('');

const totalIssues = shouldBeEnabled.length + shouldBeDisabled.length + totalPropertyIssues;

if (totalIssues === 0) {
  console.log('🎉 ✅ DATABASE MATCHES PDF 100% - PERFECT!');
} else {
  console.log(`❌ TOTAL ISSUES FOUND: ${totalIssues}`);
  console.log(`   - Plants with wrong status: ${shouldBeEnabled.length + shouldBeDisabled.length}`);
  console.log(`   - Plants with wrong properties: ${totalPropertyIssues}`);
  console.log('');
  console.log('📋 Next step: Run fix-from-pdf.cjs to automatically correct all issues');
}

console.log('');
console.log('═'.repeat(80));

// Save detailed report
const report = {
  timestamp: new Date().toISOString(),
  summary: {
    totalIssues,
    plantStatusIssues: shouldBeEnabled.length + shouldBeDisabled.length,
    propertyIssues: totalPropertyIssues
  },
  plantStatus: {
    shouldBeEnabled,
    shouldBeDisabled
  },
  propertyErrors
};

fs.writeFileSync('verification-report.json', JSON.stringify(report, null, 2));
console.log('Detailed report saved to: verification-report.json');
