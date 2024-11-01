export default class FormFieldErrorHandler {

    static #incompleteFieldMsgGenerator(node, errMsg) {
        return {node, errMsg};
    }

    static #setErrorFieldsChangeHandling(field, incompleteFieldCSS, errMsgNodeSelector) {
        field.classList.add(incompleteFieldCSS);
        let listenerType = null;
        let nodeName = null;
        switch (field.dataset.type) {
            case 'select':
                listenerType =  'change';
                nodeName = 'select';
                break;
            case 'textarea':
                listenerType =  'input';
                nodeName = 'textarea';
                break;
            default:
                listenerType = field.dataset.type === 'radio' || field.dataset.type === 'checkbox' ? 'change' : 'input';
                nodeName = 'input';
                break;
        }
        if (listenerType) {
            field.querySelectorAll(nodeName).forEach(node => {
                node.addEventListener(listenerType, () => {
                    field.classList.remove(incompleteFieldCSS);
                    const errMsgNode = field.querySelector(errMsgNodeSelector);
                    if (errMsgNode) errMsgNode.remove();
                });
            });
        }
    }

    static incompleteFieldsChecker(formData, formHandler) {
        const requiredFields = [];
        const errorFields = [];
        const incompleteFieldCSS = "incomplete-field-alert";
        const errMsgNodeDatasetCSS = "field-incomplete-msg";
        const errMsgNodeSelector = `[data-type="${errMsgNodeDatasetCSS}"]`;
        formHandler.fieldNodes.forEach(field => {
            const parentNode = field.closest(`[data-field-container]`);
            if (parentNode.dataset.required === "true" && !requiredFields.includes(parentNode)) {
                requiredFields.push(parentNode);
            }
        });
        requiredFields.forEach(field => {
            let errorToAdd = null
            switch(field.dataset.type) {
                case 'checkbox':
                    if (field.dataset.minimumRequired && formData[field.dataset.name].length < field.dataset.minimumRequired) {
                        errorToAdd = FormFieldErrorHandler.#incompleteFieldMsgGenerator(field, `${field.dataset.minimumRequired} option(s) must be checked at a minimum.`);
                        FormFieldErrorHandler.#setErrorFieldsChangeHandling(field, incompleteFieldCSS, errMsgNodeSelector);
                    } 
                    break;
                case 'radio':
                    if ([...field.querySelectorAll("input")].every(node => !node.checked)) {
                        errorToAdd = FormFieldErrorHandler.#incompleteFieldMsgGenerator(field, `1 option must be selected.`);
                        FormFieldErrorHandler.#setErrorFieldsChangeHandling(field, incompleteFieldCSS, errMsgNodeSelector);
                    }
                    break;
                default:
                    const inputNode = field.querySelector("input, select, textarea");
                    if (!inputNode.value || inputNode.value === '') {
                        errorToAdd = this.#incompleteFieldMsgGenerator(field, `This field must be filled.`);
                        FormFieldErrorHandler.#setErrorFieldsChangeHandling(field, incompleteFieldCSS, errMsgNodeSelector);
                    }
            }
            if (errorToAdd && !errorFields.includes(errorToAdd)) {
                errorFields.push(errorToAdd);
            }
        });
        if (errorFields.length > 0) {
            errorFields.forEach(field => {
                if (field.node.querySelector(errMsgNodeSelector)) return;
                const errNode = document.createElement("p");
                errNode.dataset.type = errMsgNodeDatasetCSS;
                errNode.classList.add(errMsgNodeDatasetCSS);
                errNode.innerText = field.errMsg;
                field.node.appendChild(errNode);
            });
            return false;
        }
        return true;
    }
}