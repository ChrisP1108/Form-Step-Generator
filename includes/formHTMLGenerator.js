export default class FormHTMLGenerator {

    // Properties

    #name;
    #outputNode;
    #data;
    #classes;
    #submitButtonText;
    #addRequiredAttribute;

    /** Same object in data array schema showing required fields

        order: 1,
        name: "name",
        type: "text",
        required: true,
        label: null,
        placeholder: "Name",
        value: null
    */

    constructor(name = `form-output`, outputNodeSelector = null, data = null, submitButtonText = `submit`, addRequiredAttribute = false, classes = "") {
        this.#name = name;
        this.#outputNode = document.querySelector(outputNodeSelector);
        this.#data = data;
        this.#submitButtonText = submitButtonText;
        this.#addRequiredAttribute = addRequiredAttribute;
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
            outputHTML += FormHTMLGenerator.generateInputFieldHTML(field, this.#addRequiredAttribute);
        });
        outputHTML += `<button type="submit">${this.#submitButtonText}</button></form>`;
        this.#outputNode.outerHTML = outputHTML;
    }

    static generateInputFieldHTML(field, addRequiredAttribute) {
        const fieldIdName = `field-${field.order}-${field.name}`;
        let outputHTML = `<div id="${fieldIdName}-container" class="field-container field-type-${field.type}" data-field-container data-name="${field.name}" data-required="${field.required}"
            data-order="${field.order}" ${field.type === `checkbox` && field.minimumRequired ? `data-minimum-required="${field.minimumRequired}"` : ``} data-type="${field.type}">${field.label ? `<label for="${fieldIdName}" data-field-label class="field-label" data-required="${field.required}">${field.label}</label>` : ``}`;
        const inputFields = ['text', 'email', 'password'];
        if (inputFields.includes(field.type)) {
            outputHTML += `<input id="${fieldIdName}" data-field type="${field.type}" name="${field.name}" ${field.required  && addRequiredAttribute ? `required` : ``} ${field.placeholder ? `placeholder="${field.placeholder}"` : ``} ${field.value !== null ? `value="${field.value}"` : ``} />`;
        } else {
            switch(field.type) {
                case 'select':
                    if (field.options) {
                        outputHTML += `<select id="${fieldIdName}" data-field name="${field.name}" ${field.required  && addRequiredAttribute ? `required` : ``}>`;
                        outputHTML += field.options.map(option => `<option value="${option}" ${field.value && field.value.toLowerCase() === option.toLowerCase() ? `selected` : ``}>${option}</option>`).join("");
                        outputHTML += `</select>`;
                    }
                    break;
                case 'radio':
                    outputHTML += field.options.map(option => {
                        const id = `${fieldIdName}-option-${option}`;
                        let output = `<div id="${fieldIdName}-option-${option}-container" class="radio-option-container" data-radio-option-container><label for="${id}" data-radio-option-field-label class="radio-option-field-label">${option}</label>`;
                        output += `<input id="${id}" data-field type="radio" name="${field.name}" ${field.required && addRequiredAttribute ? `required` : ``} ${field.placeholder ? `placeholder="${field.placeholder}"` : ``} value="${option}" ${field.value && field.value.toLowerCase() === option.toLowerCase() ? `checked` : ``} />`;
                        output += `</div>`
                        return output;
                    }).join("");
                    break;
                case 'checkbox':
                    outputHTML += field.options.map(option => {
                        field.value = field.value !== null ? field.value.map(f => f.toLowerCase()) : null;
                        const id = `${fieldIdName}-option-${option}`;
                        let output = `<div id="${fieldIdName}-option-${option}-container" class="checkbox-option-container" data-checkbox-option-container><label for="${id}" data-radio-option-field-label class="radio-option-field-label">${option}</label>`;
                        output += `<input id="${id}" data-field type="checkbox" data-minimum-required="${field.minimumRequired && field.minimumRequired !== 0 ? true : false}" name="${field.name}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ``} value="${option}" ${field.value && field.value.includes(option.toLowerCase()) ? `checked` : ``} />`;
                        output += `</div>`
                        return output;
                    }).join("");
                    break;
                case 'textarea':
                    outputHTML += `<textarea id="${fieldIdName}" data-field name="${field.name}" ${field.required && addRequiredAttribute ? `required` : ``} ${field.placeholder ? `placeholder="${field.placeholder}"` : ``}>${field.value !== null ? field.value : ``}</textarea>`;
                    break;
            }
        }
        return outputHTML + `</div>`;
    }
}