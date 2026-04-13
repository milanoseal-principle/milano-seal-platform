'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, ArrowLeft, User, Phone, FileText, Check, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface IntakeData {
  name: string
  email: string
  phone: string
  country: string
  document: string
  notes: string
  tier: 'signature' | 'priority' | 'executive'
}

const countries = [
  'United States',
  'Italy',
  'Spain',
  'Greece',
  'Portugal',
  'France',
  'Germany',
  'Brazil',
  'Mexico',
  'United Kingdom',
  'Canada',
  'Australia',
  'Netherlands',
  'Switzerland',
  'Austria',
  'Other',
]

const documentTypes = [
  'Power of Attorney',
  'Affidavit',
  'Birth Certificate',
  'Marriage Certificate',
  'Corporate Documents',
  'Real Estate Documents',
  'Healthcare Directive',
  'Consent Form',
  'Other',
]

interface IntakeWizardProps {
  initialTier?: 'signature' | 'priority' | 'executive'
}

export function IntakeWizard({ initialTier = 'priority' }: IntakeWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<IntakeData>({
    name: '',
    email: '',
    phone: '',
    country: '',
    document: '',
    notes: '',
    tier: initialTier,
  })

  const updateField = (field: keyof IntakeData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateStep = (): boolean => {
    switch (step) {
      case 1:
        if (!formData.name.trim()) {
          setError('Please enter your name')
          return false
        }
        if (!formData.email.trim() || !formData.email.includes('@')) {
          setError('Please enter a valid email address')
          return false
        }
        return true
      case 2:
        if (!formData.phone.trim()) {
          setError('Please enter your phone number')
          return false
        }
        if (!formData.country) {
          setError('Please select your country')
          return false
        }
        return true
      case 3:
        if (!formData.document) {
          setError('Please select a document type')
          return false
        }
        return true
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!validateStep()) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit intake')
      }

      // Redirect to confirmation page
      router.push(`/intake/confirmation?id=${data.dealId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  const stepIndicators = [
    { number: 1, label: 'Contact', icon: User },
    { number: 2, label: 'Location', icon: Phone },
    { number: 3, label: 'Document', icon: FileText },
  ]

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="flex justify-center mb-12">
        {stepIndicators.map((indicator, index) => (
          <div key={indicator.number} className="flex items-center">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                step >= indicator.number
                  ? 'border-[#C6A55A] bg-[#C6A55A]/10'
                  : 'border-[#2A2A2A] bg-[#1A1A1A]'
              }`}
            >
              {step > indicator.number ? (
                <Check className="w-5 h-5 text-[#C6A55A]" />
              ) : (
                <indicator.icon className={`w-5 h-5 ${
                  step >= indicator.number ? 'text-[#C6A55A]' : 'text-[#B0B0B0]'
                }`} />
              )}
            </div>
            {index < stepIndicators.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 transition-all duration-300 ${
                step > indicator.number ? 'bg-[#C6A55A]' : 'bg-[#2A2A2A]'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Form content */}
      <div className="bg-[#111111] border border-[#2A2A2A] rounded-2xl p-8 md:p-12">
        <AnimatePresence mode="wait">
          {/* Step 1: Contact Information */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-2xl text-white mb-2">Contact Information</h2>
              <p className="text-[#B0B0B0] mb-8">How should we reach you?</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#B0B0B0] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder:text-[#B0B0B0]/50 focus:outline-none focus:border-[#C6A55A] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#B0B0B0] mb-2">Email Address</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="Enter your email"
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder:text-[#B0B0B0]/50 focus:outline-none focus:border-[#C6A55A] transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-2xl text-white mb-2">Location Details</h2>
              <p className="text-[#B0B0B0] mb-8">Where are you located?</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#B0B0B0] mb-2">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder:text-[#B0B0B0]/50 focus:outline-none focus:border-[#C6A55A] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#B0B0B0] mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => updateField('country', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#C6A55A] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Select your country</option>
                    {countries.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Document */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="font-serif text-2xl text-white mb-2">Document Details</h2>
              <p className="text-[#B0B0B0] mb-8">Tell us about your document</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-[#B0B0B0] mb-2">Document Type</label>
                  <select
                    value={formData.document}
                    onChange={(e) => updateField('document', e.target.value)}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white focus:outline-none focus:border-[#C6A55A] transition-colors appearance-none cursor-pointer"
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map(doc => (
                      <option key={doc} value={doc}>{doc}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[#B0B0B0] mb-2">Execution Tier</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['signature', 'priority', 'executive'] as const).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        onClick={() => updateField('tier', tier)}
                        className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all duration-300 ${
                          formData.tier === tier
                            ? 'border-[#C6A55A] bg-[#C6A55A]/10 text-[#C6A55A]'
                            : 'border-[#2A2A2A] bg-[#0A0A0A] text-[#B0B0B0] hover:border-[#C6A55A]/50'
                        }`}
                      >
                        {tier.charAt(0).toUpperCase() + tier.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[#B0B0B0] mb-2">Additional Notes (Optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => updateField('notes', e.target.value)}
                    placeholder="Any specific requirements or details..."
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg text-white placeholder:text-[#B0B0B0]/50 focus:outline-none focus:border-[#C6A55A] transition-colors resize-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-sm text-red-400"
          >
            {error}
          </motion.p>
        )}

        {/* Navigation buttons */}
        <div className="flex justify-between mt-10">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
              step === 1
                ? 'opacity-0 pointer-events-none'
                : 'text-[#B0B0B0] hover:text-white'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="group flex items-center gap-2 px-8 py-3 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A]"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="group flex items-center gap-2 px-8 py-3 bg-[#C6A55A] text-[#0A0A0A] font-medium rounded-lg transition-all duration-300 hover:bg-[#D4B76A] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Intake</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Trust note */}
      <p className="text-center text-sm text-[#B0B0B0]/60 mt-8">
        Your information is handled with discretion and compliance at every step.
      </p>
    </div>
  )
}
