import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const schema=new Schema({userId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},tokenHash:{type:String,required:true,unique:true},familyId:{type:String,required:true,index:true},expiresAt:{type:Date,required:true,expires:0},revokedAt:Date,replacedByHash:String,userAgent:String,ipAddress:String},{timestamps:true});
export const AuthSession=models.AuthSession||model("AuthSession",schema);
