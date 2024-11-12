import FormHTMLGenerator from "/includes/formHTMLGenerator.js";
import FormDataHandler from "/includes/formDataHandler.js";
import FormFieldErrorHandler from '/includes/formFieldErrorHandler.js';
import StateStore from "/includes/stateStore.js";

export default class FormStepGenerator {

    // Generates step.  Utilizes FormDataHandler class.  Returns promise back to FormInitSteps

    static generate() {

        return new Promise((resolve, reject) => {

            // Gathers and sorts form data for current step being iterated through

            StateStore.set("stepFieldsData", StateStore.get("apiData").filter(field => field.step === StateStore.get("step")).sort((acc, curr) => acc.order > curr.order ? 1 : -1));
            
            // Reject if form HTML couldn't be generated
            
            if (FormHTMLGenerator.generateFormHTML() === false) {
                reject();
                return;
            }

            // Instantiate FormDataHandler.  Handles form step submission, including required field handling, adding CSS loading class, and binding fields to data ids.

            const formDataHandler = new FormDataHandler(StateStore.get("formNodeSelector"), StateStore.get("submitUrlOrigin"), null, 8000);
            formDataHandler.onSubmitInit(formData => {
                const revisedData = [];

                // Collects input, select, textarea nodes and separates if part of an addon or individual

                Object.entries(formData).forEach(([key, value]) => {
                    let id = null;
                    
                    // Handles addon fields by grouping their values together in an array, having order and field keys, with the addon field names and values as an array in field key

                    if (key.includes("__")) {
                        const [addOnParentName, addOnName, order] = key.split("__");
                        const { id, name } = StateStore.get("stepFieldsData").find(field => field.name === addOnParentName);
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
                        const { id, name } = StateStore.get("stepFieldsData").find(field => field.name === key);
                        revisedData.push({ id, name, value })
                    }
                });
                formDataHandler.formData = revisedData;

                // Perform error check prior to submitting.  Return false to stop submission of incomplete fields are detected.

                if (!FormFieldErrorHandler.incompleteFieldsChecker(revisedData, formDataHandler, StateStore.get("apiData"))) {
                    return false;
                }
                formDataHandler.formNode.classList.add(StateStore.get("submitLoadingCSSClass"));
            });
            formDataHandler.onSubmitFinish(data => {
                if (!data.response.ok) reject();
                formDataHandler.formNode.classList.remove(StateStore.get("submitLoadingCSSClass"));
                formDataHandler.removeAllListeners();
                StateStore.set("step", StateStore.get("step")++);
                if (StateStore.get("step") > StateStore.get("totalSteps")) {
                    StateStore.set("finished", true);
                    resolve();
                    return;
                }
                StateStore.set("finished", false);
                resolve();
                return;
            });
        });
    }
}