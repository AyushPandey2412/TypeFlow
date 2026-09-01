import { z } from "zod";
export const raceOptionsSchema=z.object({mode:z.enum(["normal","hard","medium"]),wordCount:z.union([z.literal(25),z.literal(50),z.literal(100)]),timed:z.boolean().default(false),numbers:z.boolean().default(false),punctuation:z.boolean().default(false)});
export const completionSchema=z.object({typedText:z.string().max(20000),durationMs:z.number().int().positive().max(130000)});
export const matchmakingSchema=raceOptionsSchema.omit({timed:true}).extend({playerCount:z.union([z.literal(2),z.literal(3)]).default(3),inviteCode:z.string().trim().length(6).transform(value=>value.toUpperCase()).optional()});
export const progressSchema=z.object({raceId:z.string().min(1).max(100),typedText:z.string().max(20000)});
export const socketCompletionSchema=progressSchema.extend({durationMs:z.number().int().positive().max(130000)});
