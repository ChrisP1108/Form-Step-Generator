import FormStepGenerator from "/includes/formStepGenerator.js";

const dataReqUrl = `/data/form_structure_data.json`;

const formName = `form-output`;

const formNodeSelector = `[data-name="form-output"]`;

const submitUrlOrigin = `https://jsonplaceholder.typicode.com/posts`;

const buttonText = `Submit`;

const formCSSClasses = `form-styling`;

const submitLoadingCSSClass = `loading`;

async function initSteps() {
    let data = null;
    let totalSteps = null;
    let running = true;
    let step = 1;
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
    while(running) {
        const generateStep = new FormStepGenerator(formName, formNodeSelector, step, data, submitUrlOrigin, totalSteps, buttonText, formCSSClasses, submitLoadingCSSClass);
        try {
            const result = await generateStep.generate();
            console.log(result);
            step = result.step;
            running = !result.finished
        } catch (err) {
            console.error(err);
            running = false;
        }
    }
    document.querySelector(formNodeSelector).outerHTML = `<h1>Finished</h1>`;
}

initSteps();