import { ulid } from "ulidx"
import logger from "utils/logger.mjs";


export const FormStates = {
    Draft: "draft",
    Published: "published",
    Approved: "approved",
    Archived: "archived",
}

class Form {
    id = undefined
    orgID = undefined
    createdBy = undefined
    approverID = undefined
    title = undefined
    description = undefined

    form_schema = undefined
    form_state = undefined

    expires_on = undefined
    // enabled_alerts = undefined
    score_variance = undefined
    show_partial_match = undefined

    search_schema = {}

    build_search_schema() {

    }
}

function clampMin(min) {
    return !min ? 0 : min
}

function clampMax(max) {
    return !max ? Infinity : max
}


// This should always be called in context.
function populateFilter(body) {
    console.log(this)

    if(!this.hasFilter) {
        return
    }

    if(this.inputType == 'text') {
        this.filter = {
            t: 'range',
            range: {
                min: clampMin(body.min),
                max: clampMax(body.max)
            }
        }
    } else if(this.inputType == 'number') {
        this.filter = {
            
        }
    }
}



const RangeFilterSchema = {
    t: 'range',
    range: {}
}

const ExactFilterSchema = {
    t: 'exact',
    option: ''
}

const SomeOfFilterSchema = {
    t: 'someof',
    options: []
}

const AllOfFilterSchema = {
    t: 'allof',
    options: []
}

const TextBaseSchema = {
    q: '',
    inputType: 'text',
    label: '',
    required: false,
}

const NumberBaseSchema = {
    q: '',
    inputType: 'number',
    label: '',
    required: false,
}

const CheckBoxBaseSchema = {
    q: '',
    inputType: 'checkbox',
    label: '',
    required: false,
    choices: [],
}

const SelectBoxBaseSchema = {
    ...CheckBoxBaseSchema, 
    inputType: 'select',
}

const RadioBaseSchema = {
    q: '',
    inputType: 'radio',
    label: '',
    required: false,
    choices: [],
}

const FormRequest = {
    orgID: undefined,
    createdBy: undefined,
    approverID: undefined,
    title: undefined,
    description: undefined,
    formState: undefined,
    visibleFrom: undefined,
    expiresOn: undefined,
    enableAlerts: false,
    scoreVariance: 0,
    showPartialMatch: false,
    formSchemas: undefined,
    searchSchema: undefined,

    validate: function() { // While calling, must always be prefixied with a context. like obj.validate()
        const missing = Object.entries(FormRequest).
            filter(([key, _]) => key != 'validate').
            filter(([key, _]) => this[key] == undefined);
        
        if(missing.length > 0) {
            console.error(`Form request missing `, missing);
            return false
        }

        return true
    }
}

const schemaInputTypeMapping = {
    [TextBaseSchema.inputType]: TextBaseSchema,
    [NumberBaseSchema.inputType]: NumberBaseSchema,
    [CheckBoxBaseSchema.inputType]: CheckBoxBaseSchema,
    [SelectBoxBaseSchema.inputType]: SelectBoxBaseSchema,
    [RadioBaseSchema.inputType]: RadioBaseSchema,
}

const filterMapping = {
    [RangeFilterSchema.t]: RangeFilterSchema,
    [ExactFilterSchema.t]: ExactFilterSchema,
    [SomeOfFilterSchema.t]: SomeOfFilterSchema,
    [AllOfFilterSchema.t]: AllOfFilterSchema,
}


export class FormsRepository {
    constructor(dbconn, dbname) {
        this.dbconn = dbconn
        this.dbname = dbname
        this.collection = "form_objects"
    }

    async create(schemaData) {
        const db = this.dbconn.db(this.dbname)
        const collection = db.collection(this.collection)

        schemaData.id = ulid();
        const result = await collection.insertOne(schemaData);
        return schemaData.id
    }
}


export class FormsController {
    formsrepo = undefined

    constructor(repo) {
        this.formsrepo = repo
    }

    create(req, res) {
        var visibleFrom, expiresOn;

        try {
            visibleFrom = sanitizeVisibleFrom(req.body.visibleFrom)

            expiresOn = req.body.expiresOn || (new Date()).toLocaleString()
            
            expiresOn  = sanitizeVisibleFrom(expiresOn) 
            expiresOn.setFullYear(expiresOn.getFullYear() + 1)

        } catch(e) {
            logger.error({err: e}, `Failed with error`)
            res.status(500).json({ success: false, errors: e, errorCode: "F1001"})
            return
        }

        const formsInputs = req.body.inputSchemas || [];

        if(formsInputs.length == 0) {
            res.status(422).json({ success: false, errors: 'Empty Form Created', errorCode: "F1002" })
            return
        }
        

        const formSchemas = formsInputs.map(inputSchema => {
            inputSchema ||= {}

            if(!inputSchema.inputType) {
                return false
            }

            let formSchema = schemaInputTypeMapping[inputSchema.inputType]
            
            formSchema.q = inputSchema.question
            formSchema.inputType = inputSchema.inputType
            formSchema.label = inputSchema.label
            formSchema.required = inputSchema.required || false
            formSchema.choices = inputSchema.choices || []

            if(!inputSchema.filter) {
                return formSchema
            }

            const filterSchema = filterMapping[inputSchema.filter.t]
            if(!filterSchema) {
                res.status(422).json({ success: false, errors: 'invalid filter configuration', code: 'F1003'})
                return
            }

            formSchema.filterSchema = filterSchema
            return formSchema
        }).filter(schema => schema)

        const request = Object.assign(FormRequest, {
            orgID: req.orgID,
            createdBy: req.userID,
            approverID: req.userID, // keeping the same for now
            title: req.body.title,
            description: req.body.description,
            formState: req.body.formState || "draft",
            visibleFrom: visibleFrom,
            expiresOn: expiresOn,
            enableAlerts: false,
            scoreVariance: 0,
            showPartialMatch: false,
            formSchemas,
            searchSchema: formSchemas.map(schema => ( { key: schema.label, inputType: 'string'} )),
        })

        if(!request.validate()) {
            res.status(422).json({ success: false, errors: 'missing_fields', errorCode: 'F1005'})
            return
        }

        this.formsrepo.create(request).then((form_id) => {
            res.status(201).json({ success: true, viewpath: `/orgs/${request.orgID}/forms/${form_id}` })
            return
        }).catch(e => {
            logger.error({err: e}, `Failed to create form in mongodb`);
            res.status(500).json({ success: false, errors: 'something_went_wrong', errorCode: 'F1004' })
        })
    }


}


function sanitizeVisibleFrom(date) {
    const startsAt = new Date(date);
    
    if(isNaN(startsAt.getTime())) {
        throw 'InvalidDate'
    }

    return startsAt;
}