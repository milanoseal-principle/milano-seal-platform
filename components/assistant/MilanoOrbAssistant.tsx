"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { ROLE_PROMPT_REGISTRY, AssistantRoleMode } from '@/lib/assistant/assistantPrompts';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

interface MilanoOrbAssistantProps {
  roleMode?: AssistantRoleMode;
}

export function MilanoOrbAssistant({ roleMode = 'PUBLIC' }: MilanoOrbAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Quiet the closed control when the footer is in view so it never competes
  // with footer branding.
  const [nearFooter, setNearFooter] = useState(false);
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    const obs = new IntersectionObserver(
      ([entry]) => setNearFooter(entry.isIntersecting),
      { rootMargin: '0px 0px -10% 0px' },
    );
    obs.observe(footer);
    return () => obs.disconnect();
  }, []);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const config = ROLE_PROMPT_REGISTRY[roleMode];

  // Spring for utility button inertial shear at open
  const orbShearSpring = useSpring(0, { stiffness: 300, damping: 18 });
  const orbScaleY = useTransform(orbShearSpring, [-1, 0, 1], [0.88, 1, 0.88]);
  const orbScaleX = useTransform(orbShearSpring, [-1, 0, 1], [1.06, 1, 1.06]);

  // Spring for panel mount with overshoot
  const panelY = useSpring(isOpen ? 0 : 20, { stiffness: 260, damping: 22, mass: 1.1 });
  useEffect(() => { panelY.set(isOpen ? 0 : 20); }, [isOpen, panelY]);

  const handleOpen = useCallback(() => {
    orbShearSpring.set(1);
    setTimeout(() => orbShearSpring.set(0), 350);
    setIsOpen(true);
    setTimeout(() => inputRef.current?.focus(), 400);
  }, [orbShearSpring]);

  const handleClose = useCallback(() => {
    orbShearSpring.set(-1);
    setTimeout(() => orbShearSpring.set(0), 350);
    setIsOpen(false);
  }, [orbShearSpring]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Message = { role: 'user', text: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text.trim(), role: roleMode }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Unable to connect. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, roleMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const isEmpty = messages.length === 0;

  return (
    <div
      className="fixed z-50 font-mono select-none"
      style={{
        bottom: "calc(env(safe-area-inset-bottom) + 86px)",
        right: "16px",
      }}
    >
      <style>{`@keyframes ms-goldPulse{0%,100%{opacity:.78}50%{opacity:1}}@media(prefers-reduced-motion:reduce){.ms-ai-orb{animation:none!important}}`}</style>
      {/* Anamorphic bloom SVG filter */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <defs>
          <filter id="ms-orb-bloom" x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6 15" result="blur" />
            <feColorMatrix in="blur" type="matrix"
              values="1.4 0.3 0   0 0.1
                      0.8 1.0 0   0 0.05
                      0   0   0.4 0 0
                      0   0   0   1 0"
              result="tinted"
            />
            <feMerge>
              <feMergeNode in="tinted" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* ── ASSISTANT UTILITY BUTTON — deliberately not the Feather-M / globe brain ── */
          <motion.button
            key="orb"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: nearFooter ? 0.35 : 1, scale: nearFooter ? 0.88 : 1 }}
            whileHover={{ opacity: 1, scale: nearFooter ? 0.95 : 1.04 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            onClick={handleOpen}
            className="group relative flex items-center gap-2.5 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/60 rounded-full touch-manipulation bg-transparent border-none shadow-none"
            aria-label="Open Milano AI Assistant"
          >
            {/* hover label — reads as an assistant utility, not a logo */}
            <span className="pointer-events-none hidden md:inline-block rounded-full border border-[var(--ms-gold)]/30 bg-[#050507]/85 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/85 opacity-0 -translate-x-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
              Ask Milano AI
            </span>
            <span className="relative flex h-[72px] w-[72px] items-center justify-center md:h-[76px] md:w-[76px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/milano-seal-orb-v2.png"
                alt=""
                aria-hidden="true"
                width={76}
                height={76}
                className="ms-ai-orb"
                style={{
                  display: "block",
                  objectFit: "contain",
                  filter: "drop-shadow(0 0 10px rgba(212,175,55,0.35))",
                  animation: "ms-goldPulse 7s ease-in-out infinite",
                }}
              />
              {/* live status dot */}
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#050507]" />
            </span>
          </motion.button>
        ) : (
          /* ── PANEL ── */
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            style={{
              width: "min(380px, calc(100vw - 2rem))",
              maxHeight: "calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 7rem)",
              WebkitBackdropFilter: "blur(40px)",
            }}
            className="bg-[#050507]/85 backdrop-blur-[40px] border border-zinc-800 rounded-sm overflow-hidden shadow-[0_32px_80px_-15px_rgba(0,0,0,0.97)] relative flex flex-col"
          >
            {/* Top accent line */}
            <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent z-20" />

            {/* Header */}
            <div className="p-4 border-b border-zinc-900/80 bg-zinc-950/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/milano-seal-orb-v2.png"
                  alt=""
                  aria-hidden="true"
                  width={28}
                  height={28}
                  style={{ display: "block", objectFit: "contain", flexShrink: 0 }}
                />
                <div className="flex flex-col">
                  <span className="text-[9.5px] font-bold tracking-[0.15em] text-zinc-100 uppercase">Milano AI Assistant</span>
                  <span className="text-[7px] text-zinc-500 tracking-wider uppercase">{roleMode === 'PUBLIC' ? 'Secure Execution Desk' : roleMode + ' MODE'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-emerald-500/5 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
                  <span className="h-1 w-1 rounded-full bg-emerald-400" />
                  <span className="text-[6.5px] text-emerald-400 font-bold tracking-widest uppercase">AVAILABLE</span>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center text-zinc-600 hover:text-zinc-300 transition-colors touch-manipulation"
                  aria-label="Close"
                >
                  <span className="text-xs">✕</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 p-4 space-y-3 overflow-y-auto"
              style={{ maxHeight: 280, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              {isEmpty && (
                <div className="text-center py-4">
                  <p className="text-[9px] text-zinc-500 tracking-wide leading-relaxed">
                    Welcome to The Milano Seal™. Ask about apostille coordination, RON, or international document execution.
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 mt-4">
                    {config.chips.map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => sendMessage(chip.prompt)}
                        className="border border-zinc-800 bg-zinc-950/60 rounded-sm text-left text-zinc-400 hover:border-amber-500/30 hover:text-amber-400 transition-all duration-200 px-2.5 py-2 text-[8px] tracking-wide uppercase min-h-[40px] touch-manipulation"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-sm text-[10px] leading-relaxed tracking-wide ${
                      msg.role === 'user'
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-100'
                        : 'bg-zinc-900/50 border border-zinc-800 text-zinc-300'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-sm text-zinc-500 text-[10px]">
                    <span className="animate-pulse">Processing...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(inputValue);
              }}
              className="p-3 border-t border-zinc-900 bg-black/30 flex gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask securely..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-sm px-3 py-2 text-[10px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500/40"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-bold tracking-widest uppercase rounded-sm disabled:opacity-30 hover:bg-amber-500/15 transition-colors"
              >
                Send
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
