const assert = require('node:assert');

var form = {
    "orgID": "01HW840WXF5TXPZW61FK2BCXXK",
    "createdBy": "01HW8HH9NMX9GNQF5SC046PWPP",
    "approverID": "01HW8HH9NMX9GNQF5SC046PWPP",
    "title": "Form Sample",
    "description": "A valid form with all input types",
    "formState": "published",
    "visibleFrom": "2024-04-24T22:30:30.052Z",
    "expiresOn": "2025-04-25T08:33:49.000Z",
    "enableAlerts": false,
    "scoreVariance": 0,
    "showPartialMatch": false,
    "formSchemas": [
        {
            "q": "Your name",
            "inputType": "text",
            "label": "name",
            "required": true,
            "choices": []
        },
        {
            "q": "Your email",
            "inputType": "text",
            "label": "email",
            "required": false,
            "choices": []
        },
        {
            "q": "Scale of 1 to 10 how likely are you to steal food at night",
            "inputType": "number",
            "label": "stealth",
            "required": true,
            "choices": [],
            "filterSchema": {
                "t": "range",
                "range": {
                    "min": 0,
                    "max": null
                }
            }
        },
        {
            "q": "Languages you know",
            "inputType": "select",
            "label": "languages",
            "required": true,
            "choices": [
                "English",
                "Swahili",
                "Golang"
            ]
        },
        {
            "q": "A checkbox with some matching filter",
            "inputType": "checkbox",
            "label": "somematching",
            "required": true,
            "choices": [
                "Choice1",
                "Choice2",
                "Choice3",
                "Choice4"
            ],
            "filterSchema": {
                "t": "allof",
                "options": [
                    "Choice2",
                    "Choice3"
                ]
            }
        },
        {
            "q": "A radio button to nuke your PC",
            "inputType": "radio",
            "label": "detonate",
            "required": true,
            "choices": [
                "Yes",
                "No"
            ],
            "filterSchema": {
                "t": "exact",
                "option": "No"
            }
        },
        {
            "q": "Heads or Tails",
            "inputType": "radio",
            "label": "toss",
            "required": true,
            "choices": [
                "Heads",
                "Tails"
            ],
            "filterSchema": {
                "t": "exact",
                "option": "Tails"
            }
        }
    ],
    "searchSchema": [
        {
            "key": "name",
            "inputType": "string"
        },
        {
            "key": "email",
            "inputType": "string"
        },
        {
            "key": "stealth",
            "inputType": "number"
        },
        {
            "key": "languages",
            "inputType": "[string]"
        },
        {
            "key": "somematching",
            "inputType": "[string]"
        },
        {
            "key": "detonate",
            "inputType": "string"
        },
        {
            "key": "toss",
            "inputType": "string"
        }
    ],
    "id": "01HWA67CK543J2CAGT6T1KGB3A"
}

var answerss = [
    // {
    //     "formID": "01HWA67CK543J2CAGT6T1KGB3A",
    //     "orgID": "01HW840WXF5TXPZW61FK2BCXXK",
    //     "createdBy": "01HW8HH9NMX9GNQF5SC046PWPP",
    //     "answeredBy": "guset@user.com",
    //     "answers": [
    //         {
    //             "label": "name",
    //             "value": "string"
    //         },
    //         {
    //             "label": "email",
    //             "value": "string"
    //         },
    //         {
    //             "label": "stealth",
    //             "value": 6
    //         },
    //         {
    //             "label": "languages",
    //             "value": [
    //                 "Swahili",
    //                 "English"
    //             ]
    //         },
    //         {
    //             "label": "somematching",
    //             "value": [
    //                 "Choice2",
    //                 "Choice3"
    //             ]
    //         },
    //         {
    //             "label": "detonate",
    //             "value": "Yes"
    //         },
    //         {
    //             "label": "toss",
    //             "value": "Tails"
    //         }
    //     ],
    //     "id": "01HWA684TC6DTWJN3RD9A3W03X"
    // },
    // {
    //     "formID": "01HWA67CK543J2CAGT6T1KGB3A",
    //     "orgID": "01HW840WXF5TXPZW61FK2BCXXK",
    //     "createdBy": "01HW8HH9NMX9GNQF5SC046PWPP",
    //     "answeredBy": "guset2@user.com",
    //     "answers": [
    //         {
    //             "label": "name",
    //             "value": "string"
    //         },
    //         {
    //             "label": "email",
    //             "value": "string"
    //         },
    //         {
    //             "label": "stealth",
    //             "value": 4
    //         },
    //         {
    //             "label": "languages",
    //             "value": [
    //                 "Swahili",
    //                 "English"
    //             ]
    //         },
    //         {
    //             "label": "somematching",
    //             "value": [
    //                 "Choice2",
    //                 "Choice3"
    //             ]
    //         },
    //         {
    //             "label": "detonate",
    //             "value": "Yes"
    //         },
    //         {
    //             "label": "toss",
    //             "value": "Tails"
    //         }
    //     ],
    //     "id": "01HWA689YQSGNJTV7CXY0CX7JX"
    // },
    // {
    //     "formID": "01HWA67CK543J2CAGT6T1KGB3A",
    //     "orgID": "01HW840WXF5TXPZW61FK2BCXXK",
    //     "createdBy": "01HW8HH9NMX9GNQF5SC046PWPP",
    //     "answeredBy": "guset4@user.com",
    //     "answers": [
    //         {
    //             "label": "name",
    //             "value": "string"
    //         },
    //         {
    //             "label": "email",
    //             "value": "string"
    //         },
    //         {
    //             "label": "stealth",
    //             "value": 6
    //         },
    //         {
    //             "label": "languages",
    //             "value": [
    //                 "Golang",
    //                 "English"
    //             ]
    //         },
    //         {
    //             "label": "somematching",
    //             "value": [
    //                 "Choice1",
    //                 "Choice3"
    //             ]
    //         },
    //         {
    //             "label": "detonate",
    //             "value": "Yes"
    //         },
    //         {
    //             "label": "toss",
    //             "value": "Tails"
    //         }
    //     ],
    //     "id": "01HWA68M7QQ8N7E75ZBC4HYPGW"
    // },
    // {
    //     "formID": "01HWA67CK543J2CAGT6T1KGB3A",
    //     "orgID": "01HW840WXF5TXPZW61FK2BCXXK",
    //     "createdBy": "01HW8HH9NMX9GNQF5SC046PWPP",
    //     "answeredBy": "guset6@user.com",
    //     "answers": [
    //         {
    //             "label": "name",
    //             "value": "string"
    //         },
    //         {
    //             "label": "email",
    //             "value": "string"
    //         },
    //         {
    //             "label": "stealth",
    //             "value": 1
    //         },
    //         {
    //             "label": "languages",
    //             "value": [
    //                 "Golang",
    //                 "Swahili"
    //             ]
    //         },
    //         {
    //             "label": "somematching",
    //             "value": [
    //                 "Choice1",
    //                 "Choice3"
    //             ]
    //         },
    //         {
    //             "label": "detonate",
    //             "value": "Yes"
    //         },
    //         {
    //             "label": "toss",
    //             "value": "Heads"
    //         }
    //     ],
    //     "id": "01HWA693S0N1R7B9TH2T45YBJV"
    // },
    {
        "formID": "01HWA67CK543J2CAGT6T1KGB3A",
        "orgID": "01HW840WXF5TXPZW61FK2BCXXK",
        "createdBy": "01HW8HH9NMX9GNQF5SC046PWPP",
        "answeredBy": "guset7@user.com",
        "answers": [
            {
                "label": "name",
                "value": "string"
            },
            {
                "label": "email",
                "value": "string"
            },
            {
                "label": "stealth",
                "value": 10
            },
            {
                "label": "languages",
                "value": [
                    "English",
                    "Swahili"
                ]
            },
            {
                "label": "somematching",
                "value": [
                    "Choice2",
                    "Choice3"
                ]
            },
            {
                "label": "detonate",
                "value": "Yes"
            },
            {
                "label": "toss",
                "value": "Heads"
            }
        ],
        "id": "01HWA6B9XZZW1FR4MPF82H72XG"
    }
]


function clampMin(min) {
    return !min ? 0 : (min < 0 ? 0 : min)
}

function clampMax(max) {
    return !max ? Infinity : max
}

function zipQA(form, answerss) {
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

function testZipQA() {
    const results = zipQA(form, answerss)
    // console.log(JSON.stringify(results, null, 4))

    assert.equal(results.length > 0, true)
    
    const lastResult = results.pop();
    console.log(JSON.stringify(lastResult, null, 4))

}

testZipQA()