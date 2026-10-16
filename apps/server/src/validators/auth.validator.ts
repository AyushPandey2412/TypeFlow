import { z } from "zod";
export const credentialsSchema=z.object({username:z.string().trim().min(3).max(40).regex(/^[a-zA-Z0-9_.-]+$/),password:z.string().min(1).max(128)});
export const registrationSchema=credentialsSchema.extend({password:z.string().min(10).max(128).regex(/[A-Za-z]/).regex(/[0-9]/),email:z.string().trim().email().transform(value=>value.toLowerCase())});
