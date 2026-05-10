import assert from "node:assert/strict";
import { findPostalZone } from "@/lib/global-postal-zones";
import { getShippingOhQuote } from "@/lib/shipping-oh";

function testResolveMalaysiaZones() {
  assert.equal(findPostalZone("MY", "00000"), null);
}

function testOhPricing() {
  const west = getShippingOhQuote({ countryCode: "MY", quantity: 1, postalCode: "00000" });
  const east = getShippingOhQuote({ countryCode: "AU", quantity: 1, postalCode: "87000" });
  assert.equal(west?.service, "OH");
  assert.equal(east?.service, "OH");
  assert.equal(west?.countryCode, "MY");
  assert.equal(east?.countryCode, "AU");
}

function main() {
  testResolveMalaysiaZones();
  testOhPricing();
  console.log("OH zone tests passed.");
}

main();
