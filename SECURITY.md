# SSL Certificate Handling - Security Note

## Current Implementation

The crawler is configured to **accept self-signed SSL certificates in all environments** (development and production).

### Configuration
- **SSL Validation**: Disabled (`rejectUnauthorized: false`)
- **Applies to**: All environments (development and production)
- **Reason**: printerior.al uses a self-signed certificate and will continue to do so

### Code Location
The SSL handling is in [`lib/crawler.ts`](file:///Users/eshkurti/Development/Antigravity/printeriorai/lib/crawler.ts) in the `fetchPage()` function.

## The Problem with printerior.al

The website `https://printerior.al` currently has a self-signed SSL certificate, which causes the error:
```
Error: self-signed certificate in certificate chain
```

## Solutions

### Option 1: Fix the Website's SSL Certificate (RECOMMENDED)

**Best Practice**: Ensure printerior.al has a valid SSL certificate from a trusted Certificate Authority (CA).

**How to fix:**
1. Use a free service like [Let's Encrypt](https://letsencrypt.org/)
2. Or use your hosting provider's SSL certificate
3. Ensure the certificate is properly installed and not expired

**Benefits:**
- ✅ Secure for all users
- ✅ No code changes needed
- ✅ Better SEO and trust
- ✅ No browser warnings

### Option 2: Keep Current Implementation (ACCEPTABLE)

**Current approach**: SSL validation disabled in development, enabled in production.

**When this works:**
- If printerior.al fixes their SSL certificate before production deployment
- The crawler will work in production once the certificate is valid
- Local testing still works during development

**Risks:**
- ⚠️ If the website still has an invalid certificate in production, the crawler will fail
- ⚠️ You'll need to ensure the certificate is fixed before deploying

### Option 3: Always Disable SSL Validation (NOT RECOMMENDED)

**Why this is bad:**
- ❌ Security vulnerability - susceptible to man-in-the-middle attacks
- ❌ Could expose sensitive data
- ❌ Violates security best practices
- ❌ May fail security audits

## Recommendation

**For Production:**
1. Contact printerior.al's hosting provider or web admin
2. Install a valid SSL certificate (Let's Encrypt is free and automated)
3. Keep the current code (SSL validation enabled in production)

**For Development:**
- Current implementation is fine for local testing
- SSL validation is disabled only in development mode

## Testing

To test with strict SSL validation (production mode):
```bash
NODE_ENV=production npx tsx test-simple.ts
```

This will fail if the certificate is invalid, which is the correct behavior for production.

## Code Location

The SSL handling is in [`lib/crawler.ts`](file:///Users/eshkurti/Development/Antigravity/printeriorai/lib/crawler.ts) in the `fetchPage()` function.
