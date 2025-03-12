 const getEnvVars = (name:string) => {
    if(!process.env[name]) {
        throw new Error(`Please provide environment variable ${name} in your.env file.`)
    } else {
        return process.env[name];
    }
}
export default getEnvVars