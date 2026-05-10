import assert from "node:assert/strict";
import { resolveMalaysiaOhZoneByPostcode } from "@/lib/oh-my-postal-zones";
import { resolveOhZone, calcCainiaoOH } from "@/lib/shipping-calc";

function testResolveMalaysiaZones() {
  assert.equal(resolveMalaysiaOhZoneByPostcode("00000"), "MYW");
  assert.equal(resolveMalaysiaOhZoneByPostcode("86999"), "MYW");
  assert.equal(resolveMalaysiaOhZoneByPostcode("87000"), "MYE");
  assert.equal(resolveMalaysiaOhZoneByPostcode("99999"), "MYE");
  assert.equal(resolveMalaysiaOhZoneByPostcode(" 087000 "), "MYE");
}

function testOhZoneLabels() {
  assert.equal(resolveOhZone("MY", null, "00000"), "马来西亚/西马");
  assert.equal(resolveOhZone("MY", null, "87000"), "马来西亚/东马");
}

function testOhPricing() {
  const west = calcCainiaoOH("MY", 1, null, "00000");
  const east = calcCainiaoOH("MY", 1, null, "87000");
  assert.equal(west.available, true);
  assert.equal(east.available, true);
  assert.equal(west.method, "OH");
  assert.equal(east.method, "OH");
  assert.equal(west.totalRMB, 51);
  assert.equal(east.totalRMB, 56);
}

function main() {
  testResolveMalaysiaZones();
  testOhZoneLabels();
  testOhPricing();
  console.log("Malaysia OH zone tests passed.");
}

main();
