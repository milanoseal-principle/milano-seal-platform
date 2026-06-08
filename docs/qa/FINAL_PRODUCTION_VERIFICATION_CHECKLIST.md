# Final Production Verification Checklist

## Live Production Verification Requirements

### Core Routes
- [ ] / (homepage) — loads without error, all CTAs functional
- [ ] /intake — form loads, submission works, confirmation email fires
- [ ] /map — atlas loads, all country pins functional
- [ ] /services — service index renders correctly
- [ ] /process — process overview renders correctly
- [ ] /alliance — alliance page renders correctly

### Country Corridor Pages
- [ ] /countries/italy
- [ ] /countries/spain
- [ ] /countries/brazil
- [ ] /countries/portugal
- [ ] /countries/mexico
- [ ] /countries/greece
- [ ] /countries/germany
- [ ] /countries/uae

### Professional Pages
- [ ] /professionals/law-firms
- [ ] /professionals/family-offices
- [ ] /professionals/institutional-access
- [ ] /professionals/white-label-support

### Service Pages
- [ ] /services/apostille
- [ ] /services/mobile-notary
- [ ] /services/ron

### Vertical Pages
- [ ] /verticals/maritime
- [ ] /verticals/real-estate (if exists)
- [ ] /verticals/italian-citizenship (if exists)

---

## Authentication & Portal Verification
- [ ] /login — loads without error
- [ ] /dashboard — requires authentication, redirects unauthenticated users
- [ ] /intake — public access confirmed
- [ ] No admin routes exposed to public

## Payment Gate Verification
- [ ] Payment flow initiates correctly
- [ ] Wise integration active
- [ ] No test mode active in production

## Courier Verification
- [ ] Shippo integration active
- [ ] Courier custody tracking functional
- [ ] No test labels generating in production

## RON Verification
- [ ] BlueNotary integration active
- [ ] RON sessions initiate correctly
- [ ] Session recording confirmed

## Email Verification
- [ ] Intake confirmation email fires
- [ ] Operator notification email fires
- [ ] Matter status update emails functional

---

## SEO Verification
- [ ] All meta titles under 65 characters
- [ ] All meta descriptions under 160 characters
- [ ] Canonical tags present on all pages
- [ ] No duplicate meta titles
- [ ] sitemap.xml accessible at /sitemap.xml
- [ ] robots.txt accessible at /robots.txt

## Performance Verification
- [ ] Core Web Vitals passing on mobile
- [ ] Core Web Vitals passing on desktop
- [ ] No console errors on primary routes
- [ ] No broken images
- [ ] No broken internal links

## Compliance Verification
- [ ] No guaranteed-acceptance language
- [ ] No legal advice claims
- [ ] All disclaimers present on relevant pages
- [ ] Privacy policy accessible
- [ ] Terms of service accessible
