import { randomBytes } from 'node:crypto';
import { ulid } from "ulidx";

import logger from "utils/logger.mjs";


function token(length) {
    if (length % 2 !== 0) {
        length++;
      }
    
    return randomBytes(length / 2).toString("hex");
}

export class Org {
    id = undefined
    orgDomain = undefined
    orgAccessKey = undefined
    orgName = undefined
    blocked = false

    requiredFields = ["id", "orgDomain", "orgAccessKey", "orgName"]

    constructor(orgDomain, orgName) {
        this.id = ulid();
        this.orgDomain = orgDomain;
        this.orgName = orgName;
        this.orgAccessKey = token(32)
    }

    validate() {
        const missing = this.requiredFields.find(field => this[field] === undefined);
        if(missing) {
            throw Error(`${missing} is empty`)
        }
    }
}
Org.tableName = "organisations"

function OrgDBAdapter(dbResult) {
    if(!dbResult) {
        throw Error("record_empty")
    }
    
    let org = new Org(dbResult['org_domain'])

    org.id = dbResult['id']
    org.orgAccessKey = dbResult['org_access_key']
    org.blocked = dbResult['blocked']

    return org
}

export const OrgErrors = Object.freeze({
    DuplicateRecord: "duplicate_record",
    NotFound: "not_found",
})

// Repository
export class OrgRepository {
    dbconn = undefined

    constructor(dbconn) {
        this.dbconn = dbconn
    }

    async findByDomain(domain) {
        const sql = `SELECT id, org_domain, org_access_key, blocked FROM ${Org.tableName} WHERE org_domain=?  LIMIT 1`;
        const values = [domain]
        const [rows, _] = await this.dbconn.execute(sql, values)

        logger.info("find org from db result", rows);

        if(rows.length > 0) {
           return OrgDBAdapter(rows[0])
        }

        throw Error(OrgErrors.NotFound)
    }

    async create(orgDomain, orgName) {
        try {
            let result = await this.findByDomain(orgDomain);
            if(result) {
                throw Error(OrgErrors.DuplicateRecord)
            }
        } catch(error) {
            if (error.message !== OrgErrors.NotFound) {
                throw error;
            }
        }

        const org = new Org(orgDomain, orgName)
        org.validate()

        const date = new Date(new Date().toUTCString())

        const sql = `INSERT INTO ${Org.tableName} (id, org_domain, org_name, org_access_key, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
        const values = [org.id, org.orgDomain, org.orgName, org.orgAccessKey, date, date]

        await this.dbconn.execute(sql, values)
        return org
    }
}