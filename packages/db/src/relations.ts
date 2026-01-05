import { defineRelations } from 'drizzle-orm';
import * as schema from './schema';

export { schema };

export const relations = defineRelations(schema);
