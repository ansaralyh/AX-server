import { Request, Response, NextFunction } from "express";

const catchAsyncErrors = (theFunc: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(theFunc(req, res, next)).catch((error) => {
      console.error(error); 
      next(error); 
    });
  };
};

export default catchAsyncErrors;
