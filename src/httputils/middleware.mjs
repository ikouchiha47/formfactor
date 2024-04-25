import logger from "utils/logger.mjs";

export function AuthorizationMiddleware(authSvc) {
    return function(req, res, next) {
        const authHeader = req.headers['authorization'];
        const authHeaderPrefix = "Bearer "

        if(!authHeader.startsWith(authHeaderPrefix)) {
            res.status(401).json({success:  false, errors: 'unauthorized', errorCode: "M1001"});
            return
        }

        const token = authHeader.substring(authHeaderPrefix.length);
        
        authSvc.findByAccessToken(token).then(authData => {
            logger.info("user authenticated")

            req.orgID = authData.metadata.orgID
            req.userID = authData.resourceID

            next();
        }).catch(e => {
            // console.log(e);
            logger.info(`Failed to find by access token`, e);
            res.status(500).json({ success: false, errors: "Something wenr wrong", errorCode: "M1002"})
        })
    }
}