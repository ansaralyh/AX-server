import mongoose from 'mongoose';

import getEnvVariables from '../utils/getEnvVariables';

export const connectToDb = ()=>{
  return mongoose.connect(getEnvVariables('MONGO_URI'))
}