'use client'

import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Mail, Phone, Instagram, Facebook, Linkedin, Twitter, Youtube } from 'lucide-react'

const socialLinks = [
  {
    label: 'Instagram',
    href: 'https://instagram.com/themilanoseal',
    icon: Instagram,
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com/themilanoseal',
    icon: Facebook,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/the-milano-seal/',
    icon: Linkedin,
  },
  {
    label: 'X / Twitter',
    href: 'https://x.com/themilanoseal',
    icon: Twitter,
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/@themilanoseal',
    icon: Youtube,
  },
  {
    label: 'TikTok',
    href: 'https://tiktok.com/@themilanoseal',
    icon: null,
  },
  {
    label: 'Pinterest',
    href: 'https://pinterest.com/themilanoseal',
    icon: null,
  },
  {
    label: 'Threads',
    href: 'https://threads.net/@themilanoseal',
    icon: null,
  },
]

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.75a8.2 8.2 0 0 0 4.78 1.52V6.82a4.85 4.85 0 0 1-1.01-.13z"/>
    </svg>
  )
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  )
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.386-1.93.754-.968 1.132-2.351 1.132-4.226v-.062h-5.13v-2.063h7.19v2.125c0 2.526-.566 4.51-1.683 5.898-1.408 1.77-3.593 2.677-6.895 2.677z"/>
    </svg>
  )
}

const documentLinks = [
  { label: 'Power of Attorney', href: '/services/power-of-attorney' },
  { label: 'Affidavits', href: '/services/affidavit' },
  { label: 'Birth Certificates', href: '/services/birth-certificate' },
  { label: 'Marriage Certificates', href: '/services/marriage-certificate' },
  { label: 'Corporate Documents', href: '/services/corporate-documents' },
]

const countryLinks = [
  { label: 'Apostille for Italy', href: '/apostille/italy' },
  { label: 'Apostille for Spain', href: '/apostille/spain' },
  { label: 'Apostille for Germany', href: '/apostille/germany' },
  { label: 'Apostille for France', href: '/apostille/france' },
  { label: 'Apostille for Brazil', href: '/apostille/brazil' },
]

const serviceLinks = [
  { label: 'Remote Online Notarization', href: '/services/ron' },
  { label: 'Apostille Coordination', href: '/services/apostille' },
  { label: 'International Execution', href: '/services/international' },
  { label: 'Mobile Notary', href: '/services/mobile' },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[#0A0A0A] border-t border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block mb-6">
              <Image src="/milano-seal-gold-transparent-512.png" alt="The Milano Seal" width={160} height={52} style={{height:'52px',width:'auto'}} />
            </Link>
            <p className="text-sm text-[#B0B0B0] mb-6 leading-relaxed">
              U.S. Document Execution & Apostille Liaison. Sealing trust with every signature.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-[#B0B0B0]">
                <MapPin className="w-4 h-4 text-[#C6A55A]" />
                <span>Florida, United States</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#B0B0B0]">
                <Mail className="w-4 h-4 text-[#C6A55A]" />
                <a href="mailto:contact@themilanoseal.com" className="hover:text-white transition-colors">
                  contact@themilanoseal.com
                </a>
              </div>
              <div className="flex items-center gap-3 text-sm text-[#B0B0B0]">
                <Phone className="w-4 h-4 text-[#C6A55A]" />
                <span>Available upon intake</span>
              </div>
            </div>
          </div>

          {/* Services column */}
          <div>
            <h4 className="text-white font-medium mb-6">Services</h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B0B0B0] hover:text-[#C6A55A] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Documents column */}
          <div>
            <h4 className="text-white font-medium mb-6">Documents</h4>
            <ul className="space-y-3">
              {documentLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B0B0B0] hover:text-[#C6A55A] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Countries column */}
          <div>
            <h4 className="text-white font-medium mb-6">Apostille Services</h4>
            <ul className="space-y-3">
              {countryLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#B0B0B0] hover:text-[#C6A55A] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[#2A2A2A]">
          {/* Social icons */}
          <div className="flex flex-wrap items-center gap-3 mb-6">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#2A2A2A] text-[#8A8A8A] hover:text-[#C6A55A] hover:border-[#C6A55A]/40 hover:bg-[#C6A55A]/5 transition-all duration-200"
              >
                {Icon ? (
                  <Icon className="w-3.5 h-3.5" />
                ) : label === 'TikTok' ? (
                  <TikTokIcon className="w-3.5 h-3.5" />
                ) : label === 'Pinterest' ? (
                  <PinterestIcon className="w-3.5 h-3.5" />
                ) : (
                  <ThreadsIcon className="w-3.5 h-3.5" />
                )}
              </a>
            ))}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-[#B0B0B0]">
              &copy; {currentYear} The Milano Seal™. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-sm text-[#B0B0B0] hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-[#B0B0B0] hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-[#B0B0B0]/50 text-center md:text-left">
            Nicholas Milano is a Certified Florida Notary Public. Remote Online Notarization services are provided in compliance with Florida law.
            Apostille coordination is facilitated through the appropriate Secretary of State offices. This service does not constitute legal advice.
          </p>
        </div>
      </div>
    </footer>
  )
}
