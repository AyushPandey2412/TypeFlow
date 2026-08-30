import { Schema,model,models } from "mongoose";
const schema=new Schema({sessionId:{type:String,required:true,unique:true},displayName:{type:String,required:true},expiresAt:{type:Date,required:true,expires:0}},{timestamps:true});
export const GuestSession=models.GuestSession||model("GuestSession",schema);
