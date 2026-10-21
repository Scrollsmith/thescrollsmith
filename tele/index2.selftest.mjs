#!/usr/bin/env node
// Pure-function checks for the patched router. No Telegram / Nomi / Kindroid calls.
import {
    stripInclinationThought,
    spokenOnly,
    buildPayload,
    resolveTargetKey,
    applyStatusFrom,
    MAX_PAYLOAD_CHARS
} from './index2.mjs';

let failed = 0;
const ok = (name, cond) => {
    if (cond) console.log(`  ✅ ${name}`);
    else {
        failed++;
        console.log(`  ❌ ${name}`);
    }
};

console.log('\n🧪 index2 selftest\n');

const tagged = '<inclination>I distrust him</inclination>\nHello, council.';
ok('strips XML inclination wrappers', spokenOnly(tagged) === 'Hello, council.');

const labeled = 'Inclination: private lean\n\nWe should meet at dusk.';
ok('strips labeled inclination preamble', spokenOnly(labeled) === 'We should meet at dusk.');

ok('leaves spoken text alone', spokenOnly('Just a hello.') === 'Just a hello.');

ok('aliases resolve', resolveTargetKey('zara') === 'sabrina' && resolveTargetKey('lumin') === 'naomi');

const header = '[SYS MEM: keep this]';
const body = 'x'.repeat(2000);
const packed = buildPayload(header, body);
ok('keeps SYS MEM at the front', packed.startsWith('[SYS MEM: keep this]'));
ok('stays within payload cap', packed.length <= MAX_PAYLOAD_CHARS);
ok('does not tail-slice the header off', !packed.startsWith('x'));

const noHeader = buildPayload('', 'hello');
ok('body-only payload is intact', noHeader === 'hello');

ok('strip is exported as the email helper', typeof stripInclinationThought === 'function');
ok('!status writes the situation', applyStatusFrom('!status poker night') === true);

console.log(failed ? `\n❌ ${failed} check(s) failed\n` : '\n✅ selftest clear\n');
process.exit(failed ? 1 : 0);
