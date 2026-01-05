import * as restate from '@restatedev/restate-sdk';
import { CronExpressionParser } from 'cron-parser';
import { TerminalError, serde } from '@restatedev/restate-sdk';
import type { InvocationId } from '@restatedev/restate-sdk';

type JobRequest = {
  id?: string;
  cronExpression: string;
  service: string;
  method: string;
  key?: string;
  payload?: string;
};

type JobInfo = {
  request: JobRequest;
  next_execution_time: string;
  next_execution_id: InvocationId;
};

const JOB_STATE = 'job-state';

export const cronJobInitiator = restate.service({
  name: 'CronJobInitiator',
  handlers: {
    create: async (ctx: restate.Context, request: JobRequest) => {
      const jobId = request.id ?? ctx.rand.uuidv4();
      const job = await ctx.objectClient(cronJob, jobId).initiate(request);
      return `Job created with ID ${jobId} and next execution time ${job.next_execution_time}`;
    },
  },
});
export type CronJobInitiatorService = typeof cronJobInitiator;

export const cronJob = restate.object({
  name: 'CronJob',
  handlers: {
    initiate: async (
      ctx: restate.ObjectContext,
      request: JobRequest,
    ): Promise<JobInfo> => {
      if (await ctx.get<JobInfo>(JOB_STATE)) {
        throw new TerminalError('Job already exists for this ID.');
      }

      return await scheduleNextExecution(ctx, request);
    },
    execute: async (ctx: restate.ObjectContext) => {
      const jobState = await ctx.get<JobInfo>(JOB_STATE);
      if (!jobState) {
        throw new TerminalError('Job not found.');
      }

      const { service, method, key, payload } = jobState.request;
      if (payload) {
        ctx.genericSend({
          service,
          method,
          parameter: payload,
          key,
          inputSerde: serde.json,
        });
      } else {
        ctx.genericSend({
          service,
          method,
          parameter: undefined,
          key,
          inputSerde: serde.empty,
        });
      }

      await scheduleNextExecution(ctx, jobState.request);
    },
    cancel: async (ctx: restate.ObjectContext) => {
      const jobState = await ctx.get<JobInfo>(JOB_STATE);
      if (jobState) {
        ctx.cancel(jobState.next_execution_id);
      }

      ctx.clearAll();
    },
    getInfo: restate.handlers.object.shared(
      async (ctx: restate.ObjectSharedContext) => {
        return ctx.get<JobInfo>(JOB_STATE);
      },
    ),
  },
});
export type CronJobService = typeof cronJob;

const scheduleNextExecution = async (
  ctx: restate.ObjectContext,
  request: JobRequest,
): Promise<JobInfo> => {
  const currentDate = await ctx.date.now();
  let interval;
  try {
    interval = CronExpressionParser.parse(request.cronExpression, {
      currentDate,
      tz: 'UTC',
    });
  } catch (e) {
    throw new TerminalError(`Invalid cron expression: ${(e as Error).message}`);
  }

  const next = interval.next().toDate();
  const delay = next.getTime() - currentDate;

  const thisJobId = ctx.key;
  const handle = ctx.objectSendClient(cronJob, thisJobId, { delay }).execute();

  const jobState = {
    request,
    next_execution_time: next.toString(),
    next_execution_id: await handle.invocationId,
  };
  ctx.set<JobInfo>(JOB_STATE, jobState);
  return jobState;
};
