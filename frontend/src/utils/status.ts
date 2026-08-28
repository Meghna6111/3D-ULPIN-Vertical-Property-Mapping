import type { PropertyStatus, VerificationStatus } from '@/types/property';

interface StatusMeta {
  label: string;
  className: string;
  dotClass: string;
}

const STATUS_META: Record<PropertyStatus, StatusMeta> = {
  verified: {
    label: 'Verified',
    className: 'text-success-500 border-success-500/30 bg-success-500/10',
    dotClass: 'bg-success-500',
  },
  warning: {
    label: 'Warning',
    className: 'text-warn-500 border-warn-500/30 bg-warn-500/10',
    dotClass: 'bg-warn-500',
  },
  violation: {
    label: 'Violation',
    className: 'text-danger-500 border-danger-500/30 bg-danger-500/10',
    dotClass: 'bg-danger-500',
  },
  rescue: {
    label: 'High Rescue Priority',
    className: 'text-danger-500 border-danger-500/40 bg-danger-500/15',
    dotClass: 'bg-danger-500 animate-pulse-soft',
  },
  active: {
    label: 'Active',
    className: 'text-accent-300 border-accent-500/30 bg-accent-500/10',
    dotClass: 'bg-accent-400',
  },
  pending: {
    label: 'Pending',
    className: 'text-warn-500/80 border-warn-500/20 bg-warn-500/5',
    dotClass: 'bg-warn-500/70',
  },
};

const VERIFICATION_META: Record<VerificationStatus, string> = {
  verified: 'text-success-500',
  pending: 'text-warn-500',
  mismatch: 'text-danger-500',
};

const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  verified: 'Verified',
  pending: 'Pending Review',
  mismatch: 'Document Mismatch',
};

export function statusMeta(status: PropertyStatus): StatusMeta {
  return STATUS_META[status];
}

export function verificationLabel(status: VerificationStatus): string {
  return VERIFICATION_LABEL[status];
}

export function verificationClass(status: VerificationStatus): string {
  return VERIFICATION_META[status];
}

export function statusLabel(status: PropertyStatus): string {
  return STATUS_META[status].label;
}
