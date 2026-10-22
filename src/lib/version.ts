import { version } from '../../package.json';

// GitHub run numbers increase for pushes, scheduled builds and manual releases.
// The attempt distinguishes a republished build from its original run.
const build = process.env.GITHUB_RUN_NUMBER
  ? `${process.env.GITHUB_RUN_NUMBER}.${process.env.GITHUB_RUN_ATTEMPT || '1'}`
  : new Date().toISOString().replace(/[-:.]/g, '');

export const siteVersion = `${version}+${build}`;
