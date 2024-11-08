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
                if (!FormFieldErrorHandler.incompleteFieldsChecker(formData, formDataHandler)) {
                    return false;
                }
                const revisedData = {};
                Object.entries(formData).forEach(([key, value]) => {
                    let id = null;
                    if (key.includes("_") && key.includes("-")) {
                        const addOnParentName = key.split("_")[0];
                        id = stepFields.find(field => field.name === addOnParentName)?.id;
                        if (!revisedData[addOnParentName]?.value) {
                            revisedData[addOnParentName] = { };
                            revisedData[addOnParentName].value = [];
                        } else {
                            revisedData[addOnParentName].value = { [key]: value }
                        }
                        revisedData[addOnParentName].id = id;
                    } else {
                        id = stepFields.find(field => field.name === key)?.id;
                        if (!revisedData[key]) {
                            revisedData[key] = { };
                        }
                        revisedData[key].value = value;
                        revisedData[key].id = id;
                    }
                });
                formDataHandler.formData = revisedData;
                console.log(formDataHandler.formData);
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