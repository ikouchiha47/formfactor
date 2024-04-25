import { ulid } from "ulidx";
import { randomBytes } from "node:crypto";

import logger from "utils/logger.mjs";


function token(length) {
    if (length % 2 !== 0) {
        length++;
      }
    
    return randomBytes(length / 2).toString("hex");
}

const ACCESS_EXPIRES_IN_SECONDS = 86400
const REFRESH_EXPIRES_IN_SECONDS = 164000

export class Authy {
    resourceID = undefined
    resourceType = undefined
    accessToken = undefined
    refreshToken = undefined
    accessExpiresAt = undefined
    refreshExpiresAt = undefined

    metadata = {}

    build(resourceID, resourceType) {
        const date = new Date(new Date().toUTCString())


        this.resourceID = resourceID
        this.resourceType = resourceType

        this.accessToken = token(32)
        this.refreshToken = token(32)
        this.accessExpiresAt =  new Date(date.setSeconds(date.getSeconds() + ACCESS_EXPIRES_IN_SECONDS));
        this.refreshExpiresAt = new Date(date.setSeconds(date.getSeconds() + REFRESH_EXPIRES_IN_SECONDS));

        return this;
    }
}

Authy.tableName = "access_tokens"

export const AuthErrors = Object.freeze({
    TokenNotFound: "token_not_found"
})

function AccessTokensDbAdapter(dbResult) {
    const auth = new Authy();

    auth.resourceID = dbResult['resource_id']
    auth.resourceType = dbResult['resource_type']
    auth.accessToken = dbResult['access_token']
    auth.refreshToken = dbResult['refresh_token']
    auth.accessExpiresAt = new Date(dbResult['access_expires_at'])
    auth.refreshExpiresAt = new Date(dbResult['refresh_expires_at'])

    return auth
}

export class AuthyService {
    dbconn = undefined

    constructor(dbconn) {
        this.dbconn = dbconn
    }

    async create(resourceID, resourceType) {
        const authn = (new Authy()).build(resourceID, resourceType);
        const date = new Date(new Date().toUTCString());

        const sql = `INSERT INTO ${Authy.tableName} 
            (resource_id, resource_type, access_token, refresh_token, access_expires_at, refresh_expires_at, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`

        const values = [
            authn.resourceID, 
            authn.resourceType.description,
            authn.accessToken, // hash the access and refresh token for safety
            authn.refreshToken,
            authn.accessExpiresAt,
            authn.refreshExpiresAt,
            date,
            date,
         ]

         await this.dbconn.execute(sql, values)
         logger.info("access token generated for user")

         return authn
    }

    async findByAccessToken(accessToken) {
        const date = new Date(new Date().toUTCString());

        const sql = `SELECT 
            auth.resource_id as resource_id
            ,auth.resource_type
            ,auth.access_token
            ,auth.refresh_token
            ,auth.access_expires_at
            ,auth.refresh_expires_at
            ,u.org_id as org_id
        FROM ${Authy.tableName} auth, users u 
        WHERE auth.access_token = ? AND auth.access_expires_at > ?
        AND u.id = auth.resource_id AND u.user_type = auth.resource_type`

        const values = [accessToken, date]

        const [rows, _] = await this.dbconn.execute(sql, values)
        
        if(rows.length == 0) {
            throw Error(AuthErrors.TokenNotFound)
        }

        const authData = AccessTokensDbAdapter(rows[0])
        authData.metadata = { orgID: rows[0]['org_id'], userID: rows[0]['resource_id']}

        return authData;
    }
}