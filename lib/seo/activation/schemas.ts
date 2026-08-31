import { z } from "zod";
import {
  AUTHORITY_PLACEMENT_STATUSES,
  AUTHORITY_PLACEMENT_TYPES,
  AUTHORITY_RELATIONSHIP_CLASSES,
  AUTHORITY_RELATIONSHIP_STATUSES,
  AUTHORITY_VERIFICATION_METHODS,
  SEO_ACTIVATION_STATUSES,
} from "./types";

const optionalSlug = z.string().trim().max(120).regex(/^[a-z0-9-]+$/).optional().nullable();
const optionalText = (max: number) => z.string().trim().max(max).optional().nullable();
const targetPage = z.string().trim().max(500).startsWith("/");
const httpsUrl = z.string().url().max(1500).refine((value) => value.startsWith("https://"), "HTTPS URL required");

export const createAuthorityRelationshipSchema = z.object({
  organizationName: z.string().trim().min(2).max(240),
  canonicalDomain: optionalText(255),
  relationshipClass: z.enum(AUTHORITY_RELATIONSHIP_CLASSES),
  countrySlug: optionalSlug,
  locale: optionalText(16),
  pillar: optionalText(120),
  targetPage,
  status: z.enum(AUTHORITY_RELATIONSHIP_STATUSES).default("PROSPECT"),
  notes: optionalText(4000),
  nextActionAt: z.string().datetime().optional().nullable(),
});

export const updateAuthorityRelationshipSchema = z.object({
  canonicalDomain: optionalText(255),
  relationshipClass: z.enum(AUTHORITY_RELATIONSHIP_CLASSES).optional(),
  countrySlug: optionalSlug,
  locale: optionalText(16),
  pillar: optionalText(120),
  targetPage: targetPage.optional(),
  status: z.enum(AUTHORITY_RELATIONSHIP_STATUSES).optional(),
  ownerUserId: z.string().uuid().optional().nullable(),
  notes: optionalText(4000),
  lastContactedAt: z.string().datetime().optional().nullable(),
  nextActionAt: z.string().datetime().optional().nullable(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const createAuthorityPlacementSchema = z.object({
  relationshipId: z.string().uuid(),
  targetPage,
  sourceUrl: httpsUrl,
  placementType: z.enum(AUTHORITY_PLACEMENT_TYPES),
  anchorText: optionalText(500),
  status: z.enum(AUTHORITY_PLACEMENT_STATUSES).default("PENDING"),
  verificationMethod: z.enum(AUTHORITY_VERIFICATION_METHODS).optional().nullable(),
  evidenceSnapshot: z.record(z.unknown()).default({}),
}).superRefine((value, ctx) => {
  if (value.status === "VERIFIED" && !value.verificationMethod) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["verificationMethod"], message: "Verified placement requires a verification method." });
  }
});

export const updateAuthorityPlacementSchema = z.object({
  targetPage: targetPage.optional(),
  sourceUrl: httpsUrl.optional(),
  placementType: z.enum(AUTHORITY_PLACEMENT_TYPES).optional(),
  anchorText: optionalText(500),
  status: z.enum(AUTHORITY_PLACEMENT_STATUSES).optional(),
  verificationMethod: z.enum(AUTHORITY_VERIFICATION_METHODS).optional().nullable(),
  evidenceSnapshot: z.record(z.unknown()).optional(),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");

export const updateActivationActionSchema = z.object({
  status: z.enum(SEO_ACTIVATION_STATUSES).optional(),
  ownerUserId: z.string().uuid().optional().nullable(),
  resolutionNotes: optionalText(4000),
}).refine((value) => Object.keys(value).length > 0, "At least one field is required");
