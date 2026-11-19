---
"agent-inspect": patch
---

Repair scoped npm packaging: verify packs and qualifies all 18 release tarballs, then Trusted Publish ships those exact artifacts (with `dist/`) instead of re-packing an empty fresh checkout.
