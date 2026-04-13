'use client'

import Link from 'next/link'
import { MapPin, Mail, Phone } from 'lucide-react'

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
              <span className="font-serif text-2xl font-medium text-white">
                The Milano Seal<span className="text-[#C6A55A]">™</span>
              </span>
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
                <a href="tel:+1" className="hover:text-white transition-colors">
                  Available upon intake
                </a>
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
