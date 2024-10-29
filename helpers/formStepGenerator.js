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

    #incompleteFieldMsgGenerator(node, errMsg) {
        return {node, errMsg};
    }

    #incompleteFieldsHandler(formData, formHandler) {
        const requiredFields = [];
        const errorFields = [];
        const incompleteFieldClass = "incomplete-field-alert";
        formHandler.fieldNodes.forEach(field => {
            const parentNode = field.closest(`[data-field-container]`);
            if (parentNode.dataset.required === "true" && !requiredFields.includes(parentNode)) {
                requiredFields.push(parentNode);
            }
        });
        requiredFields.forEach(field => {
            switch(field.dataset.type) {
                case 'checkbox':
                    if (field.dataset.minimumRequired && formData[field.dataset.name].length < field.dataset.minimumRequired) {
                        const errorToAdd = this.#incompleteFieldMsgGenerator(field, `${field.dataset.minimumRequired} option(s) must be checked at a minimum.`);
                        field.classList.add(incompleteFieldClass);
                        field.querySelectorAll("input").forEach(checkbox => {
                            checkbox.addEventListener("change", () => {
                                field.classList.remove("incomplete-field-alert");
                                field.querySelector(`[data-type="field-incomplete-msg"]`).remove();
                            });
                        });
                        if (!errorFields.includes(errorToAdd)) {
                            errorFields.push(errorToAdd);
                        }
                    } 
                    break;
                case 'radio':
                    if ([...field.querySelectorAll("input")].every(node => !node.checked)) {
                        const errorToAdd = this.#incompleteFieldMsgGenerator(field, `1 option must be selected.`);
                        if (!errorFields.includes(errorToAdd)) {
                            errorFields.push(errorToAdd);
                        }
                        field.querySelectorAll("input").forEach(radio => {
                            radio.addEventListener("change", () => {
                                field.classList.remove("incomplete-field-alert");
                                field.querySelector(`[data-type="field-incomplete-msg"]`).remove();
                            });
                        });
                    }
                    break;
                default:
                    const inputNode = field.querySelector("input, select, textarea");
                    if (!inputNode.value || inputNode.value === '') {
                        const errorToAdd = this.#incompleteFieldMsgGenerator(field, `This field must be filled.`);
                        if (!errorFields.includes(errorToAdd)) {
                            errorFields.push(errorToAdd);
                        }
                        if (inputNode.nodeName === 'SELECT') {
                            field.querySelector("input").addEventListener("change", () => {
                                field.classList.remove("incomplete-field-alert");
                                field.querySelector(`[data-type="field-incomplete-msg"]`).remove();
                            });
                        } else {
                            field.querySelector("input").addEventListener("input", () => {
                                field.classList.remove("incomplete-field-alert");
                                field.querySelector(`[data-type="field-incomplete-msg"]`).remove();
                            });
                        }
                    }
            }
        });
        if (errorFields.length > 0) {
            errorFields.forEach(field => {
                const errNode = document.createElement("p");
                errNode.dataset.type = "field-incomplete-msg";
                errNode.classList.add("field-incomplete-msg");
                errNode.innerText = field.errMsg;
                field.node.appendChild(errNode);
            });
            return false;
        }
        return true;
    }

    generate() {
        return new Promise((resolve, reject) => {
            if (!this.#formNodeSelector || !this.#step || !this.#data || !this.#submitUrl || !this.#totalSteps) {
                reject(`formNodeSelector, step, data, submitUrl, and totalSteps property values must be passed into constructor of FormStepGenerator class.`);
                return;
            }
            const stepFields = this.#data.filter(field => field.step === this.#step).sort((acc, curr) => acc.order > curr.order ? 1 : -1);
            const generateForm = new FormHTMLGenerator(this.#formName, this.#formNodeSelector, stepFields, this.#buttonText, false, this.#formCSSClasses);
            if (generateForm.generateFormHTML() === false) {
                reject();
                return;
            }
            const formHandler = new FormHandler(this.#formNodeSelector, this.#submitUrl, null, 8000);
            formHandler.onSubmitInit(formData => {
                if (!this.#incompleteFieldsHandler(formData, formHandler)) {
                    return false;
                }
                formHandler.formNode.classList.add(this.#loadingCSSClass);
            });
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