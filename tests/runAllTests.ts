import { spawnSync } from 'child_process';
import path from 'path';

const dir = import.meta.dirname;
const testFiles = [
  path.join(dir, 'taxCalculations.test.ts'),
  path.join(dir, 'quotationAndStorage.test.ts'),
  path.join(dir, 'firestoreRules.test.ts'),
  path.join(dir, 'paymentSecurity.test.ts'),
];

let failed = false;

for (const file of testFiles) {
  console.log(`\n========================================`);
  console.log(`Executing ${path.basename(file)}...`);
  console.log(`========================================`);
  const res = spawnSync('npx', ['tsx', file], {
    stdio: 'inherit',
    shell: true,
  });

  if (res.status !== 0) {
    console.error(`FAILED: ${file}`);
    failed = true;
  }
}

if (failed) {
  console.error('\nOne or more test suites failed.');
  process.exit(1);
} else {
  console.log('\nAll test suites passed successfully!');
  process.exit(0);
}
