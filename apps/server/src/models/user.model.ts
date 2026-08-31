import mongoose from "mongoose";
const { Schema, model, models } = mongoose;
const legacyResultSchema = new Schema({ speed:Number,accuracy:Number,errors:Number,category:String,subCategory:String,time:Number,date:{type:Date,default:Date.now} }, { suppressReservedKeysWarning: true });
const schema=new Schema({username:{type:String,required:true,trim:true,unique:true,index:true},email:{type:String,trim:true,lowercase:true,unique:true,sparse:true,index:true},password:{type:String,required:true},roomCode:{type:String,sparse:true,unique:true},friendCode:{type:String,sparse:true,unique:true,index:true},friendIds:{type:[Schema.Types.ObjectId],ref:"User",default:[]},role:{type:String,enum:["user","admin"],default:"user"},testResults:{type:[legacyResultSchema],default:[]}},{timestamps:true});
export const User=models.User||model("User",schema);
