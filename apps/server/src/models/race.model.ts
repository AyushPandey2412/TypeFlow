import { Schema,model,models } from "mongoose";
const packet=new Schema({packetId:{type:String,required:true},seed:{type:String,required:true},words:{type:[String],required:true},mode:{type:String,enum:["normal","hard","medium"],required:true},includeNumbers:{type:Boolean,default:false},includePunctuation:{type:Boolean,default:false}},{_id:false});
const schema=new Schema({kind:{type:String,enum:["solo","multiplayer"],required:true,index:true},status:{type:String,enum:["waiting","countdown","running","finished","cancelled"],required:true,index:true},wordPacket:{type:packet,required:true},participantIds:{type:[String],default:[]},startsAt:Date,endsAt:Date},{timestamps:true}); schema.index({status:1,createdAt:-1});
export const Race=models.Race||model("Race",schema);
