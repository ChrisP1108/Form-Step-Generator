import FormHTMLGenerator from '/includes/formHTMLGenerator.js';
import FormHandler from '/includes/formHandler.js';

export default class FormStepGenerator {

    // Properties

    static #formName;
    static #formNodeSelector;
    static #step = 1;
    static #data;
    static #totalSteps;

    static init(formName, formNodeSelector, data, totalSteps) {
        this.#formName = formName;
        this.#formNodeSelector = formNodeSelector;
        this.#data = data;
        this.#totalSteps = totalSteps;
    }

    static generate() {
        return new Promise(resolve => {
            const stepFields = FormStepGenerator.#data.filter(field => field.step === FormStepGenerator.#step).sort((acc, curr) => acc.order > curr.order ? 1 : -1);

            new FormHTMLGenerator(FormStepGenerator.#formName, FormStepGenerator.#formNodeSelector, stepFields, "Send", "form-styling");
        
            const formHandler = new FormHandler(`[data-name="form-output"]`, "https://jsonplaceholder.typicode.com/posts");
        
            formHandler.onSubmitInit(() => formHandler.formNode.classList.add("loading"));
        
            formHandler.onSubmitFinish(data => {
                formHandler.formNode.classList.remove("loading");
                formHandler.removeAllListeners();
                FormStepGenerator.#step++;
                if (FormStepGenerator.#step > FormStepGenerator.#totalSteps) {
                    resolve(false);
                }
                resolve(true);
            });
        });
    }
}