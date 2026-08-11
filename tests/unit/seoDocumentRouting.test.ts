import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getDocumentAuthorityClass,
  getDocumentAuthenticationCopy,
} from "../../lib/seo-document-routing";

test("FBI background checks use federal authentication routing and never instruct notarization", () => {
  assert.equal(getDocumentAuthorityClass("fbi-background-check"), "federal");

  const copy = getDocumentAuthenticationCopy({
    documentSlug: "fbi-background-check",
    documentName: "FBI Background Check",
    countryName: "France",
  });

  const text = JSON.stringify(copy);
  assert.match(text, /U\.S\. Department of State/);
  assert.match(text, /should not be notarized|is not notarized/);
  assert.doesNotMatch(text, /Florida Secretary of State/);
  assert.doesNotMatch(text, /notarized by a certified Florida Notary Public/);
});

test("state public records route through the issuing-state competent authority", () => {
  const copy = getDocumentAuthenticationCopy({
    documentSlug: "birth-certificate",
    documentName: "Birth Certificate",
    countryName: "Italy",
  });

  assert.equal(copy.authorityClass, "state_public_record");
  const text = JSON.stringify(copy);
  assert.match(text, /competent authority for the state that issued the record/);
  assert.match(text, /certified public record/);
  assert.doesNotMatch(text, /Document is notarized by a certified Florida Notary Public/);
});

test("private or mixed documents do not fabricate apostille or notarization requirements", () => {
  const copy = getDocumentAuthenticationCopy({
    documentSlug: "power-of-attorney",
    documentName: "Power of Attorney",
    countryName: "United Arab Emirates",
  });

  assert.equal(copy.authorityClass, "private_or_mixed");
  const text = JSON.stringify(copy);
  assert.match(text, /depends on the issuing authority/);
  assert.match(text, /Hague destinations may use an apostille/);
  assert.match(text, /non-Hague destinations may require authentication/);
  assert.match(text, /Notarization or certified-copy handling is used only when appropriate/);
});
