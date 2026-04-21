/**
 * Git Protocol Implementation
 * 
 * This module provides the core protocol implementation for Git remote operations:
 * - Smart HTTP protocol for fetch and push
 * - Pack file parsing and creation
 * - Ref advertisement parsing
 * 
 * The implementation follows the Git protocol documentation:
 * https://git-scm.com/docs/protocol-v2
 * https://git-scm.com/docs/pack-protocol
 */

// Types
// Core types
export type {
  Capabilities,
  RefInfo,
  RefAdvertisement,
  RefUpdate,
  PushResult,
  RefUpdateResult,
  PackObject,
  DeltaObject,
  PackHeader,
  PackIndexEntry,
  ProgressInfo,
  ProgressCallback,
  HttpRequestOptions,
  HttpResponse,
  Credentials,
  FetchOptions,
  PushOptions,
} from './types';

export {
  // Constants
  NULL_HASH,
  PackObjectType,
  SideBandChannel,
  PKT_FLUSH,
  PKT_DELIM,
  PKT_RESPONSE_END,
  
  // Functions
  packTypeToObjectType,
  objectTypeToPackType,
  pktLine,
  pktFlush,
  parsePktLines,
} from './types';

// Refs discovery
export {
  parseCapabilities,
  serializeCapabilities,
  parseRefAdvertisement,
  resolveHead,
  filterRefsByPattern,
  parseRefspec,
  applyFetchRefspec,
  getBranches,
  getTags,
  hasCapability,
  getObjectFormat,
} from './refs-discovery';

export type { ParsedRefspec } from './refs-discovery';

// Pack file utilities
export {
  PACK_SIGNATURE,
  readVariableInt,
  writeVariableInt,
  readPackObjectHeader,
  writePackObjectHeader,
  readOfsOffset,
  writeOfsOffset,
  parsePackHeader,
  writePackHeader,
  calculatePackChecksum,
  verifyPackChecksum,
  applyDelta,
  createDelta,
} from './pack';

// Pack file parsing
export {
  PackfileParser,
  parsePackfile,
  iteratePackObjects,
} from './packfile-parser';

export type {
  ParsedPack,
  ParsedObject,
} from './packfile-parser';

// Pack file writing
export {
  PackfileWriter,
  createPackfile,
  createThinPackfile,
  countPackObjects,
} from './packfile-writer';

export type {
  PackableObject,
  PackWriterOptions,
} from './packfile-writer';

// Smart HTTP client
export {
  SmartHttpClient,
  createRefUpdate,
  deleteRefUpdate,
  updateRefUpdate,
  parseRemoteUrl,
  normalizeRepoUrl,
} from './smart-http';

// SSH client
export {
  SSHGitClient,
  parseSSHUrl,
  isSSHUrl,
  sshToHttps,
  httpsToSsh,
} from './ssh-client';

export type {
  SSHAuthOptions,
  ParsedSSHUrl,
} from './ssh-client';
