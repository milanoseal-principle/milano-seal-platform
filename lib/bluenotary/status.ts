import type { MilanoRONStatus } from './types';

const BN_EVENT_MAP: Record<string, MilanoRONStatus> = {
  open_call_accepted:         'NOTARY_ACCEPTED',
  photo_id_passed:            'PHOTO_ID_PASSED',
  photo_id_failed:            'PHOTO_ID_FAILED',
  biometrics_passed:          'BIOMETRICS_PASSED',
  kba_started:                'KBA_STARTED',
  kba_answered:               'KBA_STARTED',
  kba_succeeded:              'KBA_PASSED',
  kba_first_set_failed:       'KBA_FAILED',
  kba_failed:                 'KBA_FAILED',
  join_session:               'SESSION_JOINED',
  leave_session:              'SESSION_LEFT',
  session_started:            'SESSION_STARTED',
  session_completed_clicked:  'SESSION_PROCESSING',
  session_completed:          'RON_COMPLETED',
  session_expired:            'RON_EXPIRED',
};

/**
 * Map a BlueNotary webhook event_type to a MilanoRONStatus.
 * Unknown event types fall back to RON_REVIEW_REQUIRED for operator triage.
 */
export function mapBNEventToMilanoStatus(eventType: string): MilanoRONStatus {
  return BN_EVENT_MAP[eventType] ?? 'RON_REVIEW_REQUIRED';
}

/** Human-readable client label for a MilanoRONStatus */
export function getClientStatusLabel(status: MilanoRONStatus): string {
  const labels: Record<MilanoRONStatus, string> = {
    RON_DRAFT:               'Preparing Your Session',
    READY_FOR_RON:           'Ready for Notarization',
    RON_SESSION_CREATED:     'Session Scheduled',
    SIGNER_INVITED:          'Invitation Sent',
    SIGNING_LINK_RELEASED:   'Access Link Ready',
    IDENTITY_STARTED:        'Identity Verification In Progress',
    PHOTO_ID_PASSED:         'Photo ID Verified',
    PHOTO_ID_FAILED:         'Photo ID Needs Attention',
    BIOMETRICS_PASSED:       'Biometric Check Passed',
    KBA_STARTED:             'Security Questions In Progress',
    KBA_PASSED:              'Security Questions Passed',
    KBA_FAILED:              'Security Questions Need Attention',
    NOTARY_ACCEPTED:         'Notary Has Accepted Your Session',
    SESSION_JOINED:          'Session In Progress',
    SESSION_LEFT:            'Session Paused',
    SESSION_STARTED:         'Session Active',
    SESSION_PROCESSING:      'Session Completing',
    RON_COMPLETED:           'Notarization Complete',
    RON_EXPIRED:             'Session Expired — Contact Coordinator',
    RON_REVIEW_REQUIRED:     'Under Review — Contact Coordinator',
    SIGNED_DOCS_RETRIEVED:   'Signed Documents Secured',
    READY_FOR_APOSTILLE:     'Ready for Apostille Processing',
  };
  return labels[status] ?? 'In Progress';
}
