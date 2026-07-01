# Extension submission template

Use this template when proposing a community AgentInspect extension for the
extension registry. Keep the submission small, reviewable, and explicit about
privacy and conformance status.

## Package

- **Package name:**
- **npm package URL:**
- **Source repository:**
- **License:**
- **Current version:**
- **Extension type:** adapter / renderer / transform / reporter / other

## Framework or runtime

- **Framework, SDK, or runtime:**
- **Supported versions:**
- **Node.js versions tested:**
- **Required peer dependencies:**
- **Optional peer dependencies:**

## Maintainer

- **Primary maintainer:**
- **GitHub handle:**
- **Contact or discussion link:**
- **Maintenance status:** active / experimental / looking for maintainer

## Privacy and safety

- **Default capture mode:** metadata-only / preview / custom
- **Network behavior:** none by default / opt-in only / required
- **Upload behavior:** none / opt-in / required
- **Secret handling:**
- **Redaction behavior:**
- **Known sensitive fields:**
- **Safe sharing notes:**

## Conformance

- **Conformance status:** passing / partial / not yet run
- **Conformance command:**
- **Conformance output or CI link:**
- **Fixture coverage:**
- **Known gaps:**

## Usage

```bash
npm install <package-name> agent-inspect
```

```ts
// Minimal setup example
```

## Registry entry

```yaml
name:
package:
repository:
type:
framework:
status:
maintainer:
privacy:
  defaultCapture:
  networkByDefault:
  uploadByDefault:
conformance:
  status:
  command:
  evidence:
```

## Review checklist

- [ ] Package name and source repository are public.
- [ ] Maintainer contact is present.
- [ ] Privacy defaults are documented.
- [ ] Network and upload behavior are explicit.
- [ ] Conformance status includes evidence or known gaps.
- [ ] Example uses synthetic data only.
- [ ] No API keys, customer logs, prompts, outputs, or private trace data are included.

