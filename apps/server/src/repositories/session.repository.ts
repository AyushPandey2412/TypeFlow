import { AuthSession } from "../models/index.js";
export const sessions = {
  create: (input:Record<string,unknown>) => AuthSession.create(input),
  findByTokenHash: (tokenHash:string) => AuthSession.findOne({tokenHash}),
  revokeFamily: (familyId:string) => AuthSession.updateMany({familyId,revokedAt:{$exists:false}},{revokedAt:new Date()}),
  revokeToken: (tokenHash:string) => AuthSession.updateOne({tokenHash},{revokedAt:new Date()}),
};
