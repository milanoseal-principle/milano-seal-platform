export interface OrbChatRequest {
  message: string;
  role: 'founder_admin' | 'operator' | 'client' | 'va';
  matter_id?: string | null;
}

export interface OrbChatResponse {
  reply: string;
  actions?: Array<{ label: string; href?: string; variant: 'primary' | 'ghost' }>;
  escalate?: boolean;
}

const VA_RESTRICTED_PATTERNS = [
  /payment amount/i,
  /amount due/i,
  /amount paid/i,
  /\$\d/,
  /wise/i,
  /signing url/i,
  /signing link/i,
  /bluenotary/i,
  /document release/i,
  /release document/i,
];

function isVaRestricted(message: string): boolean {
  return VA_RESTRICTED_PATTERNS.some((p) => p.test(message));
}

function matchesPayment(msg: string): boolean {
  return /payment|paid|invoice|wise|amount/.test(msg);
}

function matchesStatus(msg: string): boolean {
  return /\bstatus\b|where is|where are|stage|progress/.test(msg);
}

function matchesRON(msg: string): boolean {
  return /\bron\b|notary|signing|bluenotary|remote online notari/.test(msg);
}

function matchesCourier(msg: string): boolean {
  return /courier|shippo|fedex|dhl|tracking|shipment|label/.test(msg);
}

function matchesApostille(msg: string): boolean {
  return /apostille|authentication|hague|seal|stamp/.test(msg);
}

function matchesHelp(msg: string): boolean {
  return /\bhelp\b|what can you do|options/.test(msg);
}

function helpByRole(role: OrbChatRequest['role']): string {
  switch (role) {
    case 'founder_admin':
      return (
        'As founder admin, I can help you with:\n' +
        '1. Payment status and Wise transaction confirmation\n' +
        '2. Matter progress across the full pipeline\n' +
        '3. RON session oversight and signing room access\n' +
        '4. Courier tracking and apostille processing status'
      );
    case 'operator':
      return (
        'As operator, I can help you with:\n' +
        '1. Active matter status and stage progression\n' +
        '2. Payment confirmation and pending invoices\n' +
        '3. RON session management and signing room\n' +
        '4. Courier dispatch and shipment tracking'
      );
    case 'client':
      return (
        'I can assist you with:\n' +
        '1. Your matter status and next steps\n' +
        '2. Payment confirmation\n' +
        '3. Your notarization session details\n' +
        '4. Apostille processing updates'
      );
    case 'va':
      return (
        'In VA mode, I can help you with:\n' +
        '1. Matter status checks\n' +
        '2. Compliance flag review\n' +
        '3. Follow-up queue management\n' +
        '4. Courier and shipment lookups'
      );
  }
}

export function routeOrbQuery(
  req: OrbChatRequest,
  deal?: Record<string, unknown> | null
): OrbChatResponse {
  const msg = req.message.toLowerCase();
  const { role, matter_id } = req;

  // VA restricted check — must run before any payment/signing patterns
  if (role === 'va' && isVaRestricted(msg)) {
    return { reply: 'That action requires operator authorization.' };
  }

  // Help
  if (matchesHelp(msg)) {
    return { reply: helpByRole(role) };
  }

  // Payment
  if (matchesPayment(msg)) {
    if (!deal || !matter_id) {
      return { reply: 'Please open a matter to check payment status.' };
    }
    const paymentStatus = deal.payment_status as string | undefined;
    const amountDue = deal.amount_due as number | undefined;
    const amountPaid = deal.amount_paid as number | undefined;

    if (paymentStatus === 'paid') {
      const amt = amountPaid != null ? `$${amountPaid.toLocaleString()}` : 'the full amount';
      return {
        reply: `Payment confirmed — ${amt} received via Wise.`,
        actions: [
          { label: 'View Matter', href: `/dashboard/deals/${matter_id}`, variant: 'primary' },
        ],
      };
    } else {
      const amt = amountDue != null ? `$${amountDue.toLocaleString()}` : 'the outstanding balance';
      return {
        reply: `Payment is pending. Amount due: ${amt}.`,
        actions: [
          {
            label: 'Payment Details',
            href: `/dashboard/deals/${matter_id}/payment`,
            variant: 'primary',
          },
        ],
      };
    }
  }

  // Status / progress
  if (matchesStatus(msg)) {
    if (!deal || !matter_id) {
      return { reply: 'No active matter selected.' };
    }
    const status = deal.status as string | undefined;
    const readableStatus = status
      ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Unknown';
    return {
      reply: `Your matter is currently: ${readableStatus}.`,
      actions: [
        { label: 'View Matter', href: `/dashboard/deals/${matter_id}`, variant: 'ghost' },
      ],
    };
  }

  // RON / notary / signing
  if (matchesRON(msg)) {
    if (role === 'client') {
      return {
        reply:
          'Your notarization session will be scheduled once payment is confirmed. You will receive a secure link.',
        actions: [{ label: 'RON Status', href: '/portal/ron', variant: 'primary' }],
      };
    }
    return {
      reply: 'RON sessions are managed in the Signing Room.',
      actions: [{ label: 'Open Signing Room', href: '/dashboard/ron', variant: 'primary' }],
    };
  }

  // Courier / shipping
  if (matchesCourier(msg)) {
    return {
      reply: 'Courier and shipping details are managed in the Courier section.',
      actions: [{ label: 'Courier', href: '/dashboard/courier', variant: 'primary' }],
    };
  }

  // Apostille / authentication
  if (matchesApostille(msg)) {
    return {
      reply:
        'Apostille processing requires completed notarization and payment. Your matter will advance automatically.',
    };
  }

  // Fallback
  return {
    reply:
      'I can help with payment status, matter progress, RON sessions, courier tracking, and apostille questions. What do you need?',
  };
}
