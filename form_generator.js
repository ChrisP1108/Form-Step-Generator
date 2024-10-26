import FormStepGenerator from '/includes/formStepGenerator.js';

const dataReqUrl = "/data/form_structure_data.json";

const formName = "form-output";

const formNodeSelector = `[data-name="form-output"]`;

async function initSteps() {
    let data = null;
    let totalSteps = null;
    let running = true;
    try {
        const res = await fetch(dataReqUrl);
        if (!res.ok) {
            console.error(`Response returned a ${res.status} code`);
            return;
        }
        data = await res.json();
        totalSteps = [...data].sort((acc, curr) => acc.step > curr.step ? -1 : 1)[0].step;
    } catch (err) {
        console.error(err);
        return;
    }
    FormStepGenerator.init(formName, formNodeSelector, data, totalSteps);
    while(running) {
        running = await FormStepGenerator.generate();
    }
    document.querySelector(formNodeSelector).outerHTML = `<h1>Finished</h1>`;
}

initSteps();