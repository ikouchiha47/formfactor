import { ulid } from "ulidx"
import logger from "utils/logger.mjs";
import { ObjectId } from "mongodb";


export const FormStates = {
    Draft: "draft",
    Published: "published",
    Approved: "approved",
    Archived: "archived",
}

function clampMin(min) {
    return !min ? 0 : (min < 0 ? 0 : min)
}

function clampMax(max) {
    return !max ? Infinity : max
}


const RangeFilterSchema = {
    t: 'range',
    range: {},
    populate: function(filterOpt) {
        this.range = { min: 0, max: Infinity, ...filterOpt?.range}
        this.range = { min: clampMin(this.range.min), max: clampMax(this.range.max)}
    }
}

const ExactFilterSchema = {
    t: 'exact',
    option: '',
    populate: function (filterOpt) {
        this.option = filterOpt?.option || ''
    }
}

const SomeOfFilterSchema = {
    t: 'someof',
    options: [],
    populate: function(filterOpt) {
        this.options = filterOpt?.options || []
    }
}

const AllOfFilterSchema = {
    ...SomeOfFilterSchema,
    t: 'allof',
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

// TODO: take this as input from req.body.inputValueType
const searchInputTypeMapping = {
    [TextBaseSchema.inputType]: "string",
    [NumberBaseSchema.inputType]: "number",
    [CheckBoxBaseSchema.inputType]: "[string]",
    [SelectBoxBaseSchema.inputType]: "[string]",
    [RadioBaseSchema.inputType]: "string",
}

const CreateFormRequest = {
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
        const missing = Object.entries(CreateFormRequest).
            filter(([key, _]) => key != 'validate').
            filter(([key, _]) => this[key] == undefined);
        
        if(missing.length > 0) {
            logger.error({err: missing}, `Form request missing params`);
            return false
        }

        let uniques = this.formSchemas.reduce((acc, schema) => {
            return { ...acc, [schema.label]: schema.label in acc}
        }, {});

        logger.debug(`unique labels ${uniques}, labels in schema ${this.formSchemas.map(schema => schema.label)}`)

        if(Object.keys(uniques).length != this.formSchemas.length) {
            logger.error(`duplicate labels ${uniques}`);

            return false
        }

        return true
    }
}

const isUndefinedEmptyArrayOrObject = (value) => {
    return value === undefined || 
        value == "" || 
        (Array.isArray(value) && value.length === 0) || 
        (typeof value === 'object' && Object.keys(value).length === 0);
};

const getClassOf = (obj) => {
    return ({}).toString.call(obj).slice(8, -1).toLowerCase()
}
  
const CreateAnswerRequest = {
    formID: undefined,
    orgID: undefined,
    createdBy: undefined,
    answeredBy: undefined, // for now we will only store email, we can create a account for each user as a background job for users to see surveys taken
    formID: undefined,
    answers: undefined,

    validate: function(inputSchema) {
        const inputSchemaMap = inputSchema.reduce((acc, schema) => ( {...acc, [schema.key]: schema.inputType } ), {})
        const entries = Object.entries(this).filter(([key, _]) => key != 'validate');

        const missings = entries.filter(([key, value]) => {
            return isUndefinedEmptyArrayOrObject(value)
        })

        if(missings.length > 0) {
            logger.error(`missing elements ${missings}`)
            return false
        }

        logger.debug({inputSchemaMap, answers: this.answers});

        const answersMap = this.answers.map(answer => {
            const {label, value} = answer;
            
            // console.log(label, value, label in inputSchemaMap)

           if(!(label in inputSchemaMap)) {
            return { label, value, valid: false }
           }

           const valueType = inputSchemaMap[label];
           logger.info(`label ${label} value: ${value} valueType ${valueType} class ${getClassOf(value)}`)

           switch(valueType) {
            case "string":
                return { label, value, valid: getClassOf(value) == valueType }

            case "number":
                return { label, value, valid: getClassOf(value) == valueType }

            case "[string]":
                var isValid = getClassOf(value) == "array";
                if(!isValid) {
                    return { label, value, valid: false }
                }

                isValid = true
                if(value.length) {
                    isValid = value.every(elemet => getClassOf(elemet) == "string")
                }

                return { label, value, valid: isValid }

            case "[number]":
                var isValid = getClassOf(value) == "array";
                if(!isValid) {
                    return { label, value, valid: isValid }
                }

                isValid = true
                if(value.length) {
                    isValid = value.every(elemet => getClassOf(elemet) == "number")
                }

                return { label, value, valid: isValid }

            default:
                return { label, value, valid: false }
            }
        })

        // console.dir(answersMap)
        return answersMap.filter(answer => !answer.valid).length == 0
    }
}

export class FormsRepository {
    constructor(dbconn, dbname) {
        this.dbconn = dbconn
        this.dbname = dbname
        this.collection = "form_objects"
        this.answercollection = "form_answers"
        this._db = this.dbconn.db(this.dbname)
    }

    async createAnswer(schemaData) {
        schemaData.id = ulid();
        schemaData._id = new ObjectId()

        await this._db.collection(this.answercollection).insertOne(schemaData);
        return schemaData.id
    }

    async create(schemaData) {
        schemaData.id = ulid();
        schemaData._id = new ObjectId()

        await this._db.collection(this.collection).insertOne(schemaData);
        return schemaData.id
    }

    async findBy(clause, fields) {
        return await this._db.
                        collection(this.collection).
                        find(clause, {projection: {...fields, _id: 0}})
    }

    async findFormObject(id) {
        return await this._db.
                collection(this.collection).
                findOne({ "id": id }, { projection: {"_id": 0 } })    
    }
}


export class FormsController {
    formsrepo = undefined

    constructor(repo) {
        this.formsrepo = repo
    }

    create(req, res) {
        var visibleFrom, expiresOn;

        if(req.orgID != req.params.orgID) {
            res.status(401).json({ success: false, errors: 'unauthorized', errorCode: "F1006" })
            return
        }

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

            // console.log(inputSchema);

            let formSchema = {...schemaInputTypeMapping[inputSchema.inputType]}
            
            formSchema.q = inputSchema.question
            formSchema.inputType = inputSchema.inputType
            formSchema.label = inputSchema.label
            formSchema.required = inputSchema.required || false
            formSchema.choices = inputSchema.choices || []

            if(!inputSchema.filter) {
                // console.log("input", inputSchema,  "form", formSchema)
                return formSchema
            }

            const filterSchema = {...filterMapping[inputSchema.filter.t]}
            if(!filterSchema) {
                // console.log("input", inputSchema,  "form", formSchema)
                return false
            }

            filterSchema.populate(inputSchema.filter);
            formSchema.filterSchema = filterSchema
            
            // console.log("input", inputSchema,  "form", formSchema)
            return formSchema

        })
        // .filter(schema => schema).map(schema => {
        //     if(schema.filterSchema) {
        //         delete(schema.filterSchema.populate)
        //     }
        //     return schema
        // })

        let {formState} =  req.body;
        formState ||= FormStates.Draft

        if( !Object.values(FormStates).includes(formState.toLowerCase()) ) {
            res.status(422).json({ success: false, errors: 'invalid_form_state', errorCode: 'F1009' })
            return
        }

        const request = Object.assign(CreateFormRequest, {
            orgID: req.orgID,
            createdBy: req.userID,
            approverID: req.userID, // keeping the same for now
            title: req.body.title,
            description: req.body.description,
            formState: formState,
            visibleFrom: visibleFrom,
            expiresOn: expiresOn,
            enableAlerts: false,
            scoreVariance: 0,
            showPartialMatch: false,
            formSchemas,
            searchSchema: formSchemas.map(schema => ( { key: schema.label, inputType: searchInputTypeMapping[schema.inputType] || 'string'} )),
        })

        if(!request.validate()) {
            res.status(422).json({ success: false, errors: 'missing_fields', errorCode: 'F1005'})
            return
        }

        // res.status(204).json({ success: false, error: 'bypass' });
        // return

        this.formsrepo.create(request).then((form_id) => {
            res.status(201).json({ success: true, viewpath: `/orgs/${request.orgID}/forms/${form_id}` })
            return
        }).catch(e => {
            logger.error({err: e}, `Failed to create form in mongodb`);
            res.status(500).json({ success: false, errors: 'something_went_wrong', errorCode: 'F1004' })
        })
    }

    createAnswer(req, res) {
        const formParams = {
            id: req.params.formID,
            orgID: req.params.orgID,
        }

        this.formsrepo.findBy(formParams, {formSchemas: 0}).then(results => {
            if(results && results.length == 0) {
                throw 'bad_request'
            }

            return results.toArray()
        }).then(docs => {
            const result = docs[0];
            const request = Object.assign(CreateAnswerRequest, {
                formID: formParams.id,
                orgID: formParams.orgID,
                createdBy: result.createdBy,
                answeredBy: req.body.uid, // in our case this will be email or users.id for existing user
                answers: (req.body.answers || []).map(answer => ( {label: answer.label, value: answer.value} ))
            })
            
            if(!request.validate(result.searchSchema)) {
                res.status(422).json({ success: false, errors: 'invalid_input_values', errorCode: 'A1003' })
                return
            }

            // TODO: check if form is already answered by user 
            //       or create a unique key in mongodb for answeredBy
            return this.formsrepo.createAnswer(request)
        }).then((result) => {
            // console.log(result);
            res.status(201).json({ success: true, data: "survey_completed" });
            return
        }).catch(e => {
            logger.error({err: e}, `Failed to create answer`);
            res.status(500).json({ success: false, errors: 'something_went_wrong', errorCode: 'A1001'});
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