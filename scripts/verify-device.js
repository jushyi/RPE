#!/usr/bin/env node
/**
 * RPE - Physical Device Verification Script
 *
 * Interactive CLI script for verifying all critical app behaviors
 * on a physical iPhone running the TestFlight build.
 *
 * Usage:
 *   node scripts/verify-device.js           -- interactive mode
 *   node scripts/verify-device.js --dry-run  -- auto-skip all tests, write sample results
 */

'use strict';

const readline = require('readline');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// ANSI color helpers (no external dependencies)
// ---------------------------------------------------------------------------
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const WHITE = '\x1b[37m';

function green(text) { return `${GREEN}${text}${RESET}`; }
function red(text) { return `${RED}${text}${RESET}`; }
function yellow(text) { return `${YELLOW}${text}${RESET}`; }
function bold(text) { return `${BOLD}${text}${RESET}`; }
function cyan(text) { return `${CYAN}${text}${RESET}`; }
function dim(text) { return `${DIM}${text}${RESET}`; }

// ---------------------------------------------------------------------------
// Test definitions
// ---------------------------------------------------------------------------
const TEST_CASES = [
  {
    id: 'TF-01',
    name: 'App installs and launches from TestFlight',
    instructions: [
      'Open TestFlight on your iPhone.',
      'Accept the RPE invite.',
      'Install the app.',
      'Launch it and confirm the login screen appears.',
    ],
  },
  {
    id: 'ALM-01',
    name: 'Alarm fires with sound and vibration (iOS)',
    instructions: [
      'Create or edit a plan with a training day.',
      'Set the alarm time to 2 minutes from now.',
      'Lock the phone and wait.',
      'Verify the alarm fires with sound and vibration and requires dismissal.',
    ],
  },
  {
    id: 'OFF-01',
    name: 'Offline workout logging and sync',
    instructions: [
      'Enable airplane mode on the iPhone.',
      'Start a workout (plan-based or freestyle).',
      'Log at least 3 sets across 2 exercises.',
      'Finish the workout.',
      'Disable airplane mode.',
      'Wait 10 seconds.',
      'Open History tab and verify the session appears with all logged data.',
    ],
  },
  {
    id: 'RLS-01',
    name: 'RLS cross-user data isolation',
    instructions: [
      'Log out of the current account.',
      'Create a NEW account with a different email (e.g., testuser2@example.com).',
      'After login, verify:',
      '  (1) Dashboard shows no workout history',
      '  (2) History tab is empty',
      '  (3) Plans tab shows no plans',
      '  (4) Exercise library shows only default exercises (no custom exercises from first account)',
      'Log out and log back in to the original account to verify its data is still intact.',
    ],
  },
  {
    id: 'HIST-01',
    name: 'Plan-edit does not alter logged sessions',
    instructions: [
      'Note the exercises and set details in a previously logged session (from History tab).',
      'Go to Plans tab and edit that plan -- change an exercise name or remove an exercise.',
      'Go back to History and verify the old session still shows the ORIGINAL exercises and data unchanged.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Output file
// ---------------------------------------------------------------------------
const RESULTS_PATH = path.join(__dirname, 'verification-results.json');

// ---------------------------------------------------------------------------
// Prompt helper (wraps readline with Promises)
// ---------------------------------------------------------------------------
function createPrompter(rl) {
  return function prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  };
}

// ---------------------------------------------------------------------------
// Validate result input
// ---------------------------------------------------------------------------
function normalizeResult(input) {
  const lower = input.toLowerCase();
  if (lower === 'p' || lower === 'pass') return 'pass';
  if (lower === 'f' || lower === 'fail') return 'fail';
  if (lower === 's' || lower === 'skip') return 'skip';
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const isDryRun = process.argv.includes('--dry-run');

  // Header
  const now = new Date();
  const dateStr = now.toISOString();
  const localDate = now.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const localTime = now.toLocaleTimeString('en-US', { hour12: true });

  console.log('');
  console.log(bold(cyan('======================================================')));
  console.log(bold(cyan('  RPE - Physical Device Verification')));
  console.log(bold(cyan('======================================================')));
  console.log(dim(`  Date: ${localDate}`));
  console.log(dim(`  Time: ${localTime}`));
  if (isDryRun) {
    console.log(yellow('  Mode: DRY RUN (all tests auto-skipped)'));
  } else {
    console.log(dim('  Mode: Interactive'));
  }
  console.log(bold(cyan('======================================================')));
  console.log('');
  console.log(`  Total tests: ${TEST_CASES.length}`);
  console.log(`  Device: Physical iPhone (TestFlight)`);
  console.log(`  App version: 1.0.0`);
  console.log('');

  const results = [];

  if (isDryRun) {
    // Dry run: auto-skip all, no readline needed
    for (const test of TEST_CASES) {
      results.push({
        id: test.id,
        name: test.name,
        result: 'skip',
        notes: 'dry-run auto-skip',
      });
      console.log(`  ${yellow('SKIP')}  ${test.id}: ${test.name}`);
    }
    console.log('');
  } else {
    // Interactive mode
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const ask = createPrompter(rl);

    for (let i = 0; i < TEST_CASES.length; i++) {
      const test = TEST_CASES[i];

      console.log(bold(cyan(`--------------------------------------------------`)));
      console.log(bold(`Test ${i + 1} of ${TEST_CASES.length}: [${test.id}] ${test.name}`));
      console.log(bold(cyan(`--------------------------------------------------`)));
      console.log('');
      console.log(bold('Instructions:'));
      for (const line of test.instructions) {
        console.log(`  ${line}`);
      }
      console.log('');

      // Ask for result
      let result = null;
      while (result === null) {
        const raw = await ask(`Result for ${test.id} [pass / fail / skip]: `);
        result = normalizeResult(raw);
        if (result === null) {
          console.log(yellow('  Please enter: pass (p), fail (f), or skip (s)'));
        }
      }

      // Ask for notes
      const notes = await ask(`Notes (optional, press Enter to skip): `);
      console.log('');

      results.push({
        id: test.id,
        name: test.name,
        result,
        notes: notes || '',
      });
    }

    rl.close();
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  const passCount = results.filter((r) => r.result === 'pass').length;
  const failCount = results.filter((r) => r.result === 'fail').length;
  const skipCount = results.filter((r) => r.result === 'skip').length;

  console.log('');
  console.log(bold(cyan('======================================================')));
  console.log(bold(cyan('  Verification Summary')));
  console.log(bold(cyan('======================================================')));
  console.log('');

  // Table header
  console.log(
    `  ${bold(padEnd('ID', 8))}${bold(padEnd('Name', 44))}${bold('Result')}`
  );
  console.log(`  ${dim('-'.repeat(60))}`);

  for (const r of results) {
    const resultStr = resultLabel(r.result);
    const noteSuffix = r.notes ? dim(` -- ${r.notes}`) : '';
    console.log(`  ${padEnd(r.id, 8)}${padEnd(r.name, 44)}${resultStr}${noteSuffix}`);
  }

  console.log('');
  console.log(`  Passed: ${green(String(passCount))}   Failed: ${red(String(failCount))}   Skipped: ${yellow(String(skipCount))}   Total: ${TEST_CASES.length}`);
  console.log('');

  if (failCount > 0) {
    console.log(bold(red(`  DISTRIBUTION BLOCKED -- ${failCount} test(s) failed. Fix issues and re-run verification.`)));
  } else {
    console.log(bold(green('  VERIFICATION PASSED -- App is ready for distribution to friends.')));
  }

  console.log('');
  console.log(bold(cyan('======================================================')));
  console.log('');

  // ---------------------------------------------------------------------------
  // Write results JSON
  // ---------------------------------------------------------------------------
  const output = {
    date: dateStr,
    device: 'Physical iPhone (TestFlight)',
    app_version: '1.0.0',
    results: results,
    summary: {
      pass: passCount,
      fail: failCount,
      skip: skipCount,
      total: TEST_CASES.length,
    },
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(output, null, 2), 'utf8');
  console.log(`  Results written to: ${dim(RESULTS_PATH)}`);
  console.log('');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function padEnd(str, len) {
  return str.length >= len ? str.slice(0, len) : str + ' '.repeat(len - str.length);
}

function resultLabel(result) {
  switch (result) {
    case 'pass': return green('PASS');
    case 'fail': return red('FAIL');
    case 'skip': return yellow('SKIP');
    default: return result;
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
main().catch((err) => {
  console.error(red('Error running verification script:'), err.message);
  process.exit(1);
});
