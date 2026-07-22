/**
 * Schema barrel export
 */

// Brand Kit (master schema)
export {
  BrandKit,
  BrandIdentity,
  BrandKitMeta,
  ThemeMode,
  parseBrandKit,
  safeParseBrandKit,
} from './brand-kit.js';

// Color
export {
  ColorToken,
  NeutralScale,
  SemanticColors,
  SurfaceColors,
  ColorSystem,
  relativeLuminance,
  contrastRatio,
  CONTRAST_THRESHOLDS,
} from './color.js';

// Typography
export {
  FontStack,
  FontClassification,
  ScaleRatio,
  SCALE_VALUES,
  TypeScaleStep,
  TypeScale,
  TypographySystem,
  checkFontCompatibility,
} from './typography.js';

// Voice
export {
  VoiceAttribute,
  VoiceAntiPattern,
  StructuralPattern,
  VoiceSystem,
} from './voice.js';

// Media
export {
  AssetRef,
  LogoSystem,
  MediaTemplateSize,
  MediaTemplate,
  CreativeContext,
  MediaSystem,
} from './media.js';

// Spacing
export {
  SpacingScale,
  RadiusScale,
  LayoutConstraints,
} from './spacing.js';

// Decisions
export {
  Constitution,
  GateDefinition,
  RubricCriterion,
  RejectionConstraint,
  CandidateStatus,
  GenerationMethod,
  Candidate,
  DecisionEntry,
  DecisionSystem,
} from './decisions.js';
