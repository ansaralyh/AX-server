class Errorhandler extends Error{
    statusCode: number;
    constructor(messege:string,statusCode:number) {
        super(messege);
        this.statusCode = statusCode;
        Error.captureStackTrace(this,this.constructor)
    }
}
export default Errorhandler