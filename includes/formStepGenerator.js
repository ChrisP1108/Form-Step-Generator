import FormHTMLGenerator from "/includes/formHTMLGenerator.js";
import FormHandler from "/includes/formHandler.js";

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

    generate() {
        return new Promise((resolve, reject) => {
            if (!this.#formNodeSelector || !this.#step || !this.#data || !this.#submitUrl || !this.#totalSteps) {
                reject(`formNodeSelector, step, data, submitUrl, and totalSteps property values must be passed into constructor of FormStepGenerator class.`);
                return;
            }
            const stepFields = this.#data.filter(field => field.step === this.#step).sort((acc, curr) => acc.order > curr.order ? 1 : -1);
            const generateForm = new FormHTMLGenerator(this.#formName, this.#formNodeSelector, stepFields, this.#buttonText, this.#formCSSClasses);
            if (generateForm.generateFormHTML() === false) {
                reject();
                return;
            } 
            const formHandler = new FormHandler(this.#formNodeSelector, this.#submitUrl);
            formHandler.onSubmitInit(() => formHandler.formNode.classList.add(this.#loadingCSSClass));
            formHandler.onSubmitFinish(data => {
                if (!data.response.ok) reject();
                formHandler.formNode.classList.remove(this.#loadingCSSClass);
                formHandler.removeAllListeners();
                this.#step++;
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