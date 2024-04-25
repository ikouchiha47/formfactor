// This emulates safe input types
// Overall the structures should take care of
// text/textarea, number/range/radio, select/checkbox 

// const FilterTypes = {
//     RANGE: "range",
//     EXACT: "exact",
//     OPTIONS: "options",
// }

// function clampMin(min) {
//     return !min ? 0 : min
// }

// function clampMax(max) {
//     return !max ? Infinity : max
// }


// class FormElement {
//     constructor(inputType, label, required, filter) {
//         this.inputType = inputType
//         this.label = label
//         this.required = required
//         this.filter = filter
//     }
//  }

//  const FormErrors = {
//     TextLengthExceeded: "input_too_long",
//     ExactMatchFailed: "exact_match_failed",
//     InvalidOptionSelected: "invalid_option_selected",
//  }

// export class TextElement extends FormElement {
//     value = undefined;

//     constructor(label, required, filter) {
//         super("text", label, required, filter)
//     }

//     validateConfig() {
//         if(!this.filter) return true;

//         const rangeConfig = this.filter.range || {}

//         if(this.filter.t == FilterTypes.RANGE) {
//             return clampMin(rangeConfig.min) < clampMax(rangeConfig.max)
//         }

//         if(this.filter.t == FilterTypes.EXACT) {
//             return !!this.filter.option
//         }
//     }

//     validate(value) {
//         if(!this.filter) {
//             return true
//         }

//         this.value = value;
//         const filterType = this.filter.t;

//         if(filterType == FilterTypes.RANGE) {
//             const len = value.length;
//             const range = this.filter[FilterTypes.RANGE]
            
//             const [min, max] = [clampMin(range.min), clampMax(range.max)]
            
//             if(len < min || len > max) {
//                 logger.error("values length exceeded")
//                 throw FormErrors.TextLengthExceeded
//             }
            
//             return true
//         }

//         if(filterType == FilterTypes.EXACT) {
//             if(value != this.filter.exact) {
//                 throw FormErrors.ExactMatchFailed
//             }

//             return true
//         }

//         return false
//     }
// }

// export class NumberElememt extends FormElement {
//     constructor(label, required, filter) {
//         super("number", label, required, filter)
//     }

//     validateConfig() {
//         if(!this.filter) return true;

//         const rangeConfig = this.filter.range || {}

//         if(this.filter.t == FilterTypes.RANGE) {
//             return clampMin(rangeConfig.min) < clampMax(rangeConfig.max)
//         }

//         if(this.filter.t == FilterTypes.EXACT) {
//             return !!this.filter.option
//         }
//     }

//     validate(value) {
//         if(!this.filter) {
//             return true
//         }

//         this.value = value;
//         const filterType = this.filter.t;

//         if(filterType == FilterTypes.RANGE) {
//             const range = this.filter[FilterTypes.RANGE]
//             const [min, max] = [clampMin(range.min), clampMax(range.max)]
            
//             if(value < min || value > max) {
//                 logger.error("values length exceeded")
//                 throw FormErrors.TextLengthExceeded
//             }
            
//             return true
//         }

//         if(filterType == FilterTypes.EXACT) {
//             if(value != this.filter.exact) {
//                 throw FormErrors.ExactMatchFailed
//             }

//             return true
//         }

//         return false
//     }
// }


// export class SelectElements {
//     constructor(label, required, choices, filter) {
//         super("select", label, required, filter)
//         this.choices = choices || [];
//     }

//     validateConfig() {
//         if(!this.filter) return true;

//         if(this.choices.length == 0) {
//             return false
//         }

//         if(this.filter.t == FilterTypes.EXACT) {
//             return !!this.filter.option
//         }
//     }

//     validate(value) {
//         if(!this.filter) {
//             return true
//         }

//         this.value = value;
//         const filterType = this.filter.t;

//         if(filterType == FilterTypes.OPTIONS) {
//             const selected = this.choices.find(choice => choice == value);
//             if(!selected) {
//                 throw FormErrors.InvalidOptionSelected
//             }

//             return true
//         }

//         if(filterType == FilterTypes.EXACT) {
//             if(value != this.filter.exact) {
//                 throw FormErrors.ExactMatchFailed
//             }

//             return true
//         }

//         return false
//     }
// }


/*
    schema: [
        {
            question: "",
            form: {
                inputType: "text"
                label: "",
                required: "",
                filter: {
                    t: "range",
                    range: {
                        min: 0,
                        max: 100
                    }
                }
            }
        },
        {
            question: "",
            form: {
                inputType: "range",
                label: "",
                required: "",
                filter: {
                    t: "range",
                    range: {
                        min: 0,
                        max: 100
                    }
                }
            }
        },
        {
            question: "",
            form: {
                inputType: "checkbox",
                label: "",
                required: "",
                choices: [],
                filter: {
                    t: "options",
                    options: [],
                }
            }
        },
        {
            question: "",
            form: {
                inputType: "radio",
                label: "",
                required: "",
                choices: [],
                filter: {
                    t: "exact",
                    option: "",
                }
            }
        }
    ]
 */
