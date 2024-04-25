// This would ideally be divided into
// - models/
// - services/
// - controllers/

// But for the sake of the project we will 
// start with everything in the same file.

import { createHash, randomBytes } from 'node:crypto';
import { ulid } from "ulidx";
import { Org } from './organisations.mjs';

import logger from "utils/logger.mjs";

// TODO: move to utils.
function hash(string) {
  return createHash('sha256').update(string).digest('hex');
}

function token(length) {
    if (length % 2 !== 0) {
        length++;
      }
    
    return randomBytes(length / 2).toString("hex");
}

// Models
export const UserTypes = Object.freeze({
    NONE: Symbol("none"),
    ORG_ADMIN: Symbol("org_admin"),
    ORG_USER: Symbol("org_user"),
    USER: Symbol("user"),
})

const userTypeValues = Object.values(UserTypes);

export class User {
    tableName = "users"

    id = undefined
    userType = undefined
    email = undefined
    hashedPassword = undefined
    orgID = undefined
    blocked = false

    requiredFields = ["id", "userType", "email", "hashedPassword", "orgID"]

    constructor(userType, email, orgID) {
        this.userType = userType
        this.email = email
        this.blocked = false
        this.orgID = orgID
    }

    genID() {
        this.id = ulid();
    }

    setPassword(password) {
        if(password.length < 6) {
            throw Error(UserErrors.PasswordLengthError)
        }

        this.hashedPassword = hash(password)
    }

    comparePassword(password) {
        return hash(password) == this.hashedPassword
    }

    validate() {
        const missing = this.requiredFields.find(field => this[field] === undefined);

        if(missing) {
            throw Error(`${missing} is empty`)
        }

        //TODO: validate userType
        userTypeValues.find(userType => userType != this.userType)
    }
}

User.tableName = "users";


// DBAdapter
function UserDbAdapter(dbResult) {
    let userType = userTypeValues.find(userType => userType.description == dbResult['user_type']) || UserTypes.NONE

    let user = new User(
        userType,
        dbResult['email'],
        dbResult["org_id"],
    )

    if(dbResult['hashed_password']) {
        user.hashedPassword = dbResult['hashed_password']
    }

    user.id = dbResult['id']
    user.blocked = dbResult['blocked']

    return user;
}

const UserErrors = Object.freeze({
    NotFound: "not_found",
    DuplicateRecord: "already_exists",
    PasswordLengthError: "password_too_short",
})

export class UsersRepository {
    dbconn = undefined

    constructor(dbconn) {
        this.dbconn = dbconn
    }

    async find(email, password) {
        const sql = `SELECT id, org_id, email, hashed_password, user_type, blocked FROM ${User.tableName} where email = ? and blocked = 0`
        const values = [email]

        const [rows, _] = await this.dbconn.execute(sql, values)
        if(rows.length == 0) {
            throw Error(UserErrors.NotFound)
        }

        const user = UserDbAdapter(rows[0])
        if(user.comparePassword(password)) {
            return user;
        }

        logger.error(`Password mismatch for user ${email}`)
        throw Error(UserErrors.NotFound)
    }

    async findByOrg(userType, email, orgID) {        
        const sql = `SELECT user_type, email, hashed_password, blocked FROM ${User.tableName} WHERE userType = ? AND email=? AND org_id=(SELECT org_id FROM ${Org.tableName} WHERE org_id = ? LIMIT 1) LIMIT 1`
        const values = [userType.description, email, orgID]

        const [rows, _ ] = await this.dbconn.execute(sql, values)

        if(rows.length > 0) {
            return UserDbAdapter(rows[0]);
        }

        throw Error(UserErrors.NotFound);
       
    }

    async create(userType, email, password, orgID) {
        // const domain = `@${email.split("@").pop()}`;

        // // TODO: leaky domain, move to service
        // var sql = `SELECT id FROM ${Org.tableName} WHERE org_domain = ? AND blocked = 0 LIMIT 1`
        // var values = [domain]

        // var [rows, _] = await this.dbconn.execute(sql, values)
        // if(rows.length == 0) {
        //     throw Error(OrgErrors.NotFound)
        // }

        // const orgID = rows[0]['id']

        const conn = await this.dbconn.getConnection();

        try {

            await conn.beginTransaction()

            // let sql = `SELECT orgs.id as org_id FROM ${User.tableName} usrs, ${Org.tableName} orgs WHERE usrs.user_type = ? AND usrs.email=? AND orgs.org_domain=? AND usrs.org_id=orgs.id  LIMIT 1`
            var sql = `SELECT 1 FROM ${User.tableName} WHERE user_type = ? AND email = ? AND org_id = ? LIMIT 1`
            var values = [userType.description, email, orgID]

            var [rows, _ ] = await conn.execute(sql, values)

            // console.log("user records")
            // console.dir(rows)

            if(rows.length > 0) {
                throw Error(UserErrors.DuplicateRecord)
            }

            const user = new User(userType, email, orgID);

            user.setPassword(password)
            user.genID()

            user.validate()

            const date = new Date(new Date().toUTCString())

            sql = `INSERT INTO ${User.tableName} (id, user_type, email, hashed_password, org_id, blocked, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            values = [user.id, user.userType.description, email, user.hashedPassword, orgID, user.blocked, date, date]
            
            await conn.execute(sql, values);
            await conn.commit()

            return user
        } catch(e) {
            await conn.rollback()

            Promise.reject(e)
        }
    }
}

export class UserOrgService {
    userrepo = undefined
    orgrepo = undefined

    constructor(userrepo, orgrepo) {
        this.orgrepo = orgrepo
        this.userrepo = userrepo
    }

    async createUser(userType, email, password) {
        const domain = `@${email.split("@").pop()}`;
        const org = await this.orgrepo.findByDomain(domain)

        const user = await this.userrepo.create(userType, email, password, org.id)
        return user
    }

    async findUser(email, password) {
        return await this.userrepo.find(email, password)
    }
}

const UserControllerErrors = Object.freeze({
    Unauthorized: "unauthorized",
    InternalError: "something_went_wrong"
})

export class UserController {
    service = undefined
    authService = undefined

    constructor(service, authService) {
        this.service = service
        this.authService = authService
    }

    orgUserLogin(req, res) {
        this.service.findUser(req.body.email, req.body.password).then(user => {
            if(user.userType != UserTypes.ORG_USER) {
                logger.error("invalid user type for user ", req.body.email)
                throw UserControllerErrors.Unauthorized
            } else {
                return user
            }
        }).then(user => {
            return Promise.allSettled([Promise.resolve(user), this.authService.create(user.id, user.userType)])
        }).then(resolves => {
            const [user, auth] = resolves;

            if(auth.status == 'rejected') {
                logger.error(`access token creation failed`, auth.reason);
                throw UserControllerErrors.InternalError
            }

            res.status(201).json({ 
                success: true,
                data: { 
                    orgID: user.value.orgID, 
                    accessToken: auth.value.accessToken, 
                    refreshToken: auth.value.refreshToken
                }
            });
        }).catch(e => {
            console.log(e, "login error")
           
            if(e == UserControllerErrors.Unauthorized) {
                res.status(401).json({ success: false, errors: "unauthorized", errorCode: "L1001"})
                return
            }

            if(e == UserControllerErrors.InternalError) {
                res.status(500).json({ success: false, errors: "something went wrong", errorCode: "L1002"})
                return
            }

            res.status(422).json({ success: false, errors: "bad_request", errorCode: "L1003"})
        })
    }

    orgAdminLogin(req, res) {

    }

    userLogin(req, res) {

    }
}