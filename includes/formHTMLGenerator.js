export default class FormHTMLGenerator {

    // Properties

    #name;
    #outputNode;
    #data;
    #classes;
    #submitButtonText;

    /** Same object in data array schema showing required fields

        order: 1,
        name: "name",
        type: "text",
        required: true,
        label: null,
        placeholder: "Name",
        value: null
    */

    constructor(name = `form-output`, outputNodeSelector = null, data = null, submitButtonText = `submit`, classes = "") {
        this.#name = name;
        this.#outputNode = document.querySelector(outputNodeSelector);
        this.#data = data;
        this.#submitButtonText = submitButtonText;
        this.#classes = classes;
    }

    #errorCheck() {
        if (!this.#outputNode) {
            console.error(`Output node must be provided to FormHTMLGenerator class.`);
        }
        if (!this.#data || !this.#data.length) {
            console.error(`Data to generate form must be provided to FormHTMLGenerator class as an array.`);
        }
        const requiredDataKeys = [`order`, `name`, `type`, `required`, `label`, `placeholder`, `value`];

        let keysError = false;
        if (this.#data && this.#data.length !== 0) {
            this.#data.forEach((field, index) => {
                if (!requiredDataKeys.every(key => Object.keys(field).includes(key))) {
                    console.error(`Data at index "${index}" is missing one or more required key fields. Required fields are "${requiredDataKeys.join(", ")}".`);
                    keysError = true;
                }
            });
        }
        this.#data.sort((acc, curr) => acc.order > curr.order ? 1 : -1);
        if (!keysError) {
            return true;
        }
    }

    generateFormHTML() {
        if (!this.#errorCheck()) return false;
        let outputHTML = '';
        outputHTML += `<form ${this.#classes ? `class="${this.#classes}"` : ``} data-name="${this.#name}">`;
        this.#data.forEach(field => {
            outputHTML += FormHTMLGenerator.generateInputFieldHTML(field);
        });
        outputHTML += `<button type="submit">${this.#submitButtonText}</button></form>`;
        this.#outputNode.outerHTML = outputHTML;
    }

    static generateInputFieldHTML(field) {
        let outputHTML = ``;
        const inputFields = ['text', 'radio', 'checkbox', 'email', 'password'];
        if (inputFields.includes(field.type)) {
            outputHTML = `<input data-id="${field.id}" type="${field.type}" name="${field.name}" ${field.required ? `required` : ``} ${field.placeholder ? `placeholder="${field.placeholder}"` : ``} ${field.value !== null ? `value="${field.value}"` : ``} />`;
        } else {
            switch(field.type) {
                case 'select':
                    if (field.options) {
                        outputHTML = `<select data-id="${field.id}" name="${field.name}" ${field.required ? `required` : ``} ${field.value !== null ? `value="${field.value}"` : ``}>`;
                        outputHTML += field.options.map(option => `<option value=${option}>${option}</option>`).join("");
                    }
                    break;
                case 'textarea':
                    outputHTML = `<textarea data-id="${field.id}" name="${field.name}" ${field.reqiured ? `required` : ``} ${field.value !== null ? `value="${field.value}"` : ``}></textarea>`;
            }
        }
        return outputHTML;
    }
}