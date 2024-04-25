function clampMin(min) {
    return !min ? 0 : (min < 0 ? 0 : min)
}

function clampMax(max) {
    return !max ? Infinity : max
}

const allowedFilters = {
    "string": ["range", "exact"],
    "number": ["range", "exact"],
    "[string]": ["exact", "someof", "allof"],
    "[number]": ["exact", "someof", "allof"],
}

const Validators = {
    StringRange: (str, range) => {
        const len = str.length;
        return len >= clampMin(range.min) && len < clampMax(range.max)
    },
    Exact: (str, expected) => {
        return str == expected
    },
    NumInRange: (num, range) => {
        return num >= clampMin(range.min) && num < clampMax(range.max)
    },
    SomeOf: (options, choices) => { // answers.options, answers.value
        return choices.some(choice => options.includes(choice))
    },
    AllOf: (options, choices) => {
        return choices.every(choice => options.includes(choice))
    },
    ArrayExact: (value, choices) => {
        return choices.includes(value)
    }
}

const validatorRegistry = {
    "string": { range: Validators.StringRange, exact: Validators.Exact},
    "number": {range: Validators.NumInRange, exact: Validators.Exact},
    "[string]": {someof: Validators.SomeOf, allof: Validators.AllOf, exact: Validators.ArrayExact},
    "[number]": {someof: Validators.SomeOf, allof: Validators.AllOf, exact: Validators.ArrayExact},
}


export function RankAnswersWithScore(form, answerss) {
    const labelToFormSchema = form.formSchemas.reduce((acc, schema) => {
        return { ...acc, [schema.label]: schema }
    }, {})

    const keyToSearchInput  = form.searchSchema.reduce((acc, schema) => {
        return { ...acc, [schema.key]: schema.inputType }
    }, {})


    const combinedResults = answerss.map(place => {
        return place.answers.map(answer => {
            const schema = labelToFormSchema[answer.label];

            return {
                label: answer.label,
                value: answer.value,
                q: schema.q,
                schema: schema,
            }
        })
    })

   
    const aResults = combinedResults.map(answers => {
        return answers.map(answer => {
            if(!answer.schema.filterSchema) {
                return {...answer, valid: true}
            }

            const valueType = keyToSearchInput[answer.label];
            const form = answer.schema

            const filterType = form.filterSchema.t;

            if(!allowedFilters[valueType].includes(filterType)) {
                return {...answer, valid: false }
            }

            const validatorMap = validatorRegistry[valueType]
            // check if present

            const validator = validatorMap[filterType]
            if(!validator) {
                return {...answer, valid: false }
            }

            const fsch = form.filterSchema;

            if(filterType == "range") {
                return {...answer, valid: validator(answer.value, fsch.range)}
            }

            if(filterType == "allof") {
                return {...answer, valid: validator(answer.value, fsch.options)}
            }

            if(filterType == "someof") {
                return {...answer, valid: validator(answer.value, fsch.options)}
            }

            if(filterType == "exact") {
                return {...answer, valid: validator(answer.value, fsch.option)}
            }

            return {...answer, valid: true }
        })
    })

    const resultsWithScores = aResults.map(results => {
        let totalScore = results.length;
        const score = results.reduce((acc, v) => {
            acc += (v.valid ? 1 : -1)
            return acc
        }, 0)
        return {
            totalScore,
            score,
            answers: results.map(v => ({ label: v.label, value: v.value }))
        }
    })

    // console.log(aResults)
    return resultsWithScores;
}
