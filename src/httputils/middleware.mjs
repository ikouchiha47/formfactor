import logger from "utils/logger.mjs";

export function AuthorizationMiddleware(authSvc) {
    return function(req, res, next) {
        const authHeader = req.headers['authorization'] || "";
        const authHeaderPrefix = "Bearer "

        if(!authHeader.startsWith(authHeaderPrefix)) {
            req.guestLogin = true
            next();
            return
        }

        req.guestLogin = false;

        const token = authHeader.substring(authHeaderPrefix.length);
        
        authSvc.findByAccessToken(token).then(authData => {
            logger.info("user authenticated")

            req.orgID = authData.metadata.orgID
            req.userID = authData.resourceID
            req.userType = authData.resourceType

            next();
        }).catch(e => {
            // console.log(e);
            logger.error({err: e}, `Failed to find by access token`);
            res.status(500).json({ success: false, errors: "Something wenr wrong", errorCode: "M1002"})
        })
    }
}

export function ValidateAuthorized(req, res, next) {
    if (req.guestLogin) {
        res.status(401).json({ success: false, errors: 'unauthorized', errorCode: "M1001" });
        return
    }

    next();
}