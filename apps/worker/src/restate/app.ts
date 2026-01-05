import * as restate from '@restatedev/restate-sdk';
import { services } from './jobs';

void restate.serve({
  services,
  port: 9080,
});
