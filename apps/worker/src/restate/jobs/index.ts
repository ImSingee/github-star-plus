import { cronJob, cronJobInitiator } from './cron';
import { githubJobs } from './github-jobs';
import { setupService } from './setup-service';
import type { EndpointOptions } from '@restatedev/restate-sdk';

export * from './cron';
export * from './github-jobs';
export * from './setup-service';

export const services: EndpointOptions['services'] = [
  cronJob,
  cronJobInitiator,
  setupService,
  githubJobs,
];
