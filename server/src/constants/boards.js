/**
 * Shared constants for job boards used by seeders and integration UI.
 * Keep in sync with JobDistribution.JOB_BOARDS and IntegrationManager.
 */
export const BOARD_CATALOG = [
  { name: 'Indeed', type: 'API', region: 'Global', defaultStatus: 'connected' },
  { name: 'LinkedIn', type: 'API', region: 'Global', defaultStatus: 'not_connected' },
  { name: 'Monster', type: 'API', region: 'Global', defaultStatus: 'connected' },
  { name: 'Glassdoor', type: 'API', region: 'Global', defaultStatus: 'available' },
  { name: 'ZipRecruiter', type: 'API', region: 'US / Canada', defaultStatus: 'available' },
  { name: 'JobStreet', type: 'XML Feed', region: 'Southeast Asia', defaultStatus: 'available' },
  { name: 'Kalibrr', type: 'API', region: 'Philippines', defaultStatus: 'connected' },
  { name: 'OnlineJobs.ph', type: 'XML Feed', region: 'Philippines', defaultStatus: 'available' },
  { name: 'JobsDB', type: 'XML Feed', region: 'Asia Pacific', defaultStatus: 'available' },
  { name: 'PhilJobNet', type: 'API', region: 'Philippines', defaultStatus: 'available' },
  { name: 'Naukri', type: 'API', region: 'India', defaultStatus: 'not_connected' },
  { name: 'Shine', type: 'API', region: 'India', defaultStatus: 'available' },
  { name: 'Foundit', type: 'API', region: 'India / APAC', defaultStatus: 'available' },
];

export default BOARD_CATALOG;
