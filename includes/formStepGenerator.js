import FormHTMLGenerator from "/includes/formHTMLGenerator.js";
import FormDataHandler from "/includes/formDataHandler.js";
import FormFieldErrorHandler from '/includes/formFieldErrorHandler.js';

export default class FormStepGenerator {

    // Properties

    #formName;
    #formNodeSelector;
    #step;
    #data;
    #submitUrl;
    #totalSteps;
    #buttonText;
    #formCSSClasses;
    #loadingCSSClass 

    constructor (formName = `form-styling`, formNodeSelector = null, step = null, data = null, submitUrl = null, totalSteps = null, buttonText = `Submit`, formCSSClasses = ``, loadingCSSClass = ``) {
        this.#formName = formName;
        this.#formNodeSelector = formNodeSelector;
        this.#step = step;
        this.#data = data;
        this.#submitUrl = submitUrl
        this.#totalSteps = totalSteps;
        this.#buttonText = buttonText;
        this.#formCSSClasses = formCSSClasses;
        this.#loadingCSSClass = loadingCSSClass;
    }

    // Generates step.  Utilizes FormDataHandler class.  Returns promise back to FormInitSteps

    generate() {
        return new Promise((resolve, reject) => {

            // Reject if any required fields missing 
            
            if (!this.#formNodeSelector || !this.#step || !this.#data || !this.#submitUrl || !this.#totalSteps) {
                reject(`formNodeSelector, step, data, submitUrl, and totalSteps property values must be passed into constructor of FormStepGenerator class.`);
                return;
            }

            // Gathers and sorts form data for current step being iterated through

            const stepFields = this.#data.filter(field => field.step === this.#step).sort((acc, curr) => acc.order > curr.order ? 1 : -1);
            const generateForm = new FormHTMLGenerator(this.#formName, this.#formNodeSelector, stepFields, this.#buttonText, false, this.#formCSSClasses);
            
            // Reject if form HTML couldn't be generated
            
            if (generateForm.generateFormHTML() === false) {
                reject();
                return;
            }

            // Instantiate FormDataHandler.  Handles form step submission, including required field handling, adding CSS loading class, and binding fields to data ids.

            const formDataHandler = new FormDataHandler(this.#formNodeSelector, this.#submitUrl, null, 8000);
            formDataHandler.onSubmitInit(formData => {
                const revisedData = [];

                // Collects input, select, textarea nodes and separates if part of an addon or individual

                Object.entries(formData).forEach(([key, value]) => {
                    let id = null;
                    
                    // Handles addon fields by grouping their values together in an array, having order and field keys, with the addon field names and values as an array in field key

                    if (key.includes("__")) {
                        const [addOnParentName, addOnName, order] = key.split("__");
                        const { id, name } = stepFields.find(field => field.name === addOnParentName);
                        const addOnFieldNameValue = Object.entries(formData).filter(([k, v]) => k.split("__")[2] === order);
                        const addOnValues = addOnFieldNameValue.map(f => {
                            return {
                                name: f[0].split("__")[1],
                                value: f[1]
                            }
                        });
                        if (!revisedData.some(f => f.id === id && f.name === name)) {
                            revisedData.push({ id, name, value: [{ order: Number(order), fields: addOnValues}]});
                        } else {
                            const existingAddOnDataIndex = revisedData.findIndex(f => f.id === id && f.name === name);
                            if (!revisedData[existingAddOnDataIndex].value.some(f => f.order === Number(order))) {
                                revisedData[existingAddOnDataIndex].value = [...revisedData[existingAddOnDataIndex].value, { order: Number(order), fields: addOnValues}];
                            }
                        }

                    // Handles all non addon fields

                    } else {
                        const { id, name } = stepFields.find(field => field.name === key);
                        revisedData.push({ id, name, value })
                    }
                });
                formDataHandler.formData = revisedData;

                // Perform error check prior to submitting.  Return false to stop submission of incomplete fields are detected.

                if (!FormFieldErrorHandler.incompleteFieldsChecker(revisedData, formDataHandler)) {
                    return false;
                }
                formDataHandler.formNode.classList.add(this.#loadingCSSClass);
            });
            formDataHandler.onSubmitFinish(data => {
                if (!data.response.ok) reject();
                formDataHandler.formNode.classList.remove(this.#loadingCSSClass);
                formDataHandler.removeAllListeners();
                this.#step++;
                console.log(data);
                if (this.#step > this.#totalSteps) {
                    resolve({ finished: true, data });
                    return;
                }
                resolve({ finished: false, step: this.#step, data });
                return;
            });
        });
    }
}