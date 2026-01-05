import * as restate from '@restatedev/restate-sdk';
import { cronJob } from './cron';

const DAILY_JOB_ID = 'update-user-starred-repos-daily';

export const setupService = restate.service({
  name: 'SetupService',
  handlers: {
    initialize: async (ctx: restate.Context) => {
      const existingJob = await ctx
        .objectClient(cronJob, DAILY_JOB_ID)
        .getInfo();

      if (existingJob) {
        return {
          status: 'already_exists',
          jobId: DAILY_JOB_ID,
          nextExecutionTime: existingJob.next_execution_time,
        };
      }

      await ctx.objectClient(cronJob, DAILY_JOB_ID).initiate({
        id: DAILY_JOB_ID,
        cronExpression: '0 0 * * *', // daily at 00:00 UTC
        service: 'GithubJobs',
        method: 'updateUserStarredRepos',
      });

      const jobInfo = await ctx.objectClient(cronJob, DAILY_JOB_ID).getInfo();

      return {
        status: 'created',
        jobId: DAILY_JOB_ID,
        nextExecutionTime: jobInfo?.next_execution_time,
      };
    },
    getStatus: async (ctx: restate.Context) => {
      const job = await ctx.objectClient(cronJob, DAILY_JOB_ID).getInfo();

      return {
        initialized: job !== null,
        jobId: DAILY_JOB_ID,
        job,
      };
    },
    teardown: async (ctx: restate.Context) => {
      const existingJob = await ctx
        .objectClient(cronJob, DAILY_JOB_ID)
        .getInfo();

      if (!existingJob) {
        return {
          status: 'not_found',
          jobId: DAILY_JOB_ID,
        };
      }

      await ctx.objectClient(cronJob, DAILY_JOB_ID).cancel();

      return {
        status: 'cancelled',
        jobId: DAILY_JOB_ID,
      };
    },
  },
});

export type SetupServiceType = typeof setupService;
