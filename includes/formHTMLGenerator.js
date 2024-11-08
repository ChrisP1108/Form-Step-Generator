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
        const requiredDataKeys = [`order`, `name`, `type`];

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

    static generateInputFieldHTML(field, addRequiredAttribute, addOnField = false) {
        const fieldIdName = `field-${field.order}-${field.name}`;
        const addOnFieldParentName = addOnField ? `${field.addOnParentName}__` : ``;
        const addOnFieldParam = addOnField ? `addon-sub-item-` : ``;
        const addOnNumber = addOnField ? `__${field.order}` : ``;
        let outputHTML = `<div id="${fieldIdName}-${addOnFieldParam}container" ${field.type === `addon` ? `data-addon-parent-container` : ``} class="field-container ${addOnField ? `add-on-field-container` : ``} field-type-${field.type}" data-${addOnFieldParam}field-container data-name="${addOnFieldParam}${field.name}" data-required="${field.required}"
            data-order="${field.order}" ${field.type === `checkbox` && field.minimumRequired ? `data-minimum-required="${field.minimumRequired}"` : ``} data-type="${field.type}">${field.label ? `<label for="${fieldIdName}" data-field-label class="field-label" data-required="${field.required}">${field.label}</label>` : ``}`;
        const inputFields = ['text', 'email', 'password'];
        if (inputFields.includes(field.type)) {
            outputHTML += `<input id="${fieldIdName}" ${addOnField ? `data-add-on-field` : ``} data-field type="${field.type}" name="${addOnFieldParentName}${field.name}${addOnNumber}" ${field.required  && addRequiredAttribute ? `required` : ``} ${field.placeholder ? `placeholder="${field.placeholder}"` : ``} ${field.value ? `value="${field.value}"` : ``} />`;
        } else {
            switch(field.type) {
                case 'select':
                    if (field.options) {
                        outputHTML += `<select id="${fieldIdName}" ${addOnField ? `data-add-on-field` : ``} data-field name="${addOnFieldParentName}${field.name}${addOnNumber}" ${field.required  && addRequiredAttribute ? `required` : ``}>`;
                        outputHTML += field.options.map(option => `<option value="${option}" ${field.value && field.value.toLowerCase() === option.toLowerCase() ? `selected` : ``}>${option}</option>`).join("");
                        outputHTML += `</select>`;
                    }
                    break;
                case 'radio':
                    outputHTML += field.options.map(option => {
                        const id = `${fieldIdName}-option-${option}`;
                        let output = `<div id="${fieldIdName}-option-${option}-container" class="radio-option-container" data-radio-option-container><label for="${id}" data-radio-option-field-label class="radio-option-field-label">${option}</label>`;
                        output += `<input id="${id}" ${addOnField ? `data-add-on-field` : ``} data-field type="radio" name="${addOnFieldParentName}${field.name}${addOnNumber}" ${field.required && addRequiredAttribute ? `required` : ``} ${field.placeholder ? `placeholder="${field.placeholder}"` : ``} value="${option}" ${field.value && field.value.toLowerCase() === option.toLowerCase() ? `checked` : ``} />`;
                        output += `</div>`
                        return output;
                    }).join("");
                    break;
                case 'checkbox':
                    outputHTML += field.options.map(option => {
                        field.value = field.value ? field.value.map(f => f.toLowerCase()) : null;
                        const id = `${fieldIdName}-option-${option}`;
                        let output = `<div id="${fieldIdName}-option-${option}-container" class="checkbox-option-container" data-checkbox-option-container><label for="${id}" data-radio-option-field-label class="radio-option-field-label">${option}</label>`;
                        output += `<input id="${id}" ${addOnField ? `data-add-on-field` : ``} data-field type="checkbox" data-minimum-required="${field.minimumRequired && field.minimumRequired !== 0 ? true : false}" name="${addOnFieldParentName}${field.name}${addOnNumber}" ${field.placeholder ? `placeholder="${field.placeholder}"` : ``} value="${option}" ${field.value && field.value.includes(option.toLowerCase()) ? `checked` : ``} />`;
                        output += `</div>`
                        return output;
                    }).join("");
                    break;
                case 'textarea':
                    outputHTML += `<textarea id="${fieldIdName}" data-field name="${addOnFieldParentName}${field.name}${addOnNumber}" ${field.required && addRequiredAttribute ? `required` : ``} ${field.placeholder ? `placeholder="${field.placeholder}"` : ``}>${field.value ? field.value : ``}</textarea>`;
                    break;
                case 'addon':
                    field.value.forEach(group => {
                        outputHTML += `<div id="field-${group.order}-${field.name}-addon-group-container" data-addon-group-container>`;
                        group.fields.forEach(f => {
                            const addOnFieldSchema = field.schema.find(sch => sch.name === f.name);
                            const addOnFieldData = { order: group.order, value: f.value, ...addOnFieldSchema, addOnParentName: field.name };
                            outputHTML += FormHTMLGenerator.generateInputFieldHTML(addOnFieldData, addRequiredAttribute, true);
                        });
                        outputHTML += `</div>`;
                    });
            }
        }
        return outputHTML + `</div>`;
    }
}