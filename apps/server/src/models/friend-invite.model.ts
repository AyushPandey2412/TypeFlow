import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const schema=new Schema({code:{type:String,required:true,unique:true,index:true},inviterId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},inviteeId:{type:Schema.Types.ObjectId,ref:"User",required:true,index:true},status:{type:String,enum:["pending","accepted"],default:"pending",index:true},options:{mode:{type:String,enum:["normal","hard","medium"],required:true},wordCount:{type:Number,enum:[25,50,100],required:true},playerCount:{type:Number,enum:[2,3],default:2},numbers:{type:Boolean,default:false},punctuation:{type:Boolean,default:false}},expiresAt:{type:Date,required:true,index:{expires:0}}},{timestamps:true});
export const FriendInvite=models.FriendInvite||model("FriendInvite",schema);
