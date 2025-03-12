import catchAsyncErrors from '../middlewares/catchAsyncErrors';
import userModel from '../models/userModel';
import {createUser} from '../zodValidations/userValidation'
import { Request, Response } from 'express';

//Admin
export const store = catchAsyncErrors(async (req:Request, res:Response) => {
    const user = createUser.parse(req.body);
    await userModel.create(user);
    res.status(200).json({
        success:true,
        message:"user created Successfully"
    })
})