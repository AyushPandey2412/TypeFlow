import { User } from "../models/index.js";
export const users = {
  existsByUsernameOrEmail: (username:string,email:string) => User.exists({$or:[{username},{email}]}),
  create: (input:{username:string;email:string;password:string}) => User.create(input),
  findByUsername: (username:string) => User.findOne({username}),
  findById: (id:string) => User.findById(id),
  findByFriendCode: (friendCode:string) => User.findOne({friendCode}),
  withFriends: (id:string) => User.findById(id).populate("friendIds","username friendCode"),
  addMutualFriends: (firstId:string,secondId:string) => Promise.all([User.findByIdAndUpdate(firstId,{$addToSet:{friendIds:secondId}}),User.findByIdAndUpdate(secondId,{$addToSet:{friendIds:firstId}})]),
};
