import mongoose, { Document } from "mongoose";


export interface IUser extends Document {
    name:string;
    email:string;
    password:string;
    role:string;
}   
const userSchema = new mongoose.Schema({
    name:{
        type:String
    },
    email:{
        type: String
    },
    password:{
        type: String
    },
    role:{
        type:String,
        enum:['superevisor','admin']
    }

});
const userModel = mongoose.model<IUser>('User',userSchema);
export default userModel