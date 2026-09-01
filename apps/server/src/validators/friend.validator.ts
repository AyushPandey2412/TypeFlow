import { z } from "zod";
export const friendCodeSchema=z.object({code:z.string().trim().min(6).max(12).transform(value=>value.toUpperCase())});
export const friendInviteSchema=z.object({mode:z.enum(["normal","hard","medium"]),wordCount:z.union([z.literal(25),z.literal(50),z.literal(100)]),playerCount:z.union([z.literal(2),z.literal(3)]).default(2),numbers:z.boolean().default(false),punctuation:z.boolean().default(false)});
