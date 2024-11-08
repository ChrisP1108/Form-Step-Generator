import HttpGet from "/helpers/httpReq.js";
import FormStepGenerator from "/includes/formStepGenerator.js";

export default async function FormInitSteps(input) {
    const { dataReqUrl, formName, formNodeSelector, submitUrlOrigin, buttonText, formCSSClasses, submitLoadingCSSClass } = input;
    let data = null;
    let totalSteps = null;
    let running = true;
    let step = 1;

    // Gets starting data 

    try {
        const res = await HttpGet(dataReqUrl, 8000);
        if (!res.ok) {
            console.error(`Response returned a ${res.status} status code`);
            return false;
        }
        data = res.data;
        totalSteps = [...data].sort((acc, curr) => acc.step > curr.step ? -1 : 1)[0].step;
    } catch (err) {
        console.error(err);
        return false;
    }

    // Runs FormStepGenerator in continuous loop for generating form steps until FormStepGenerator returns a finished key with a value of true
    
    while(running) {  
        try {
            const generateStep = new FormStepGenerator(formName, formNodeSelector, step, data, submitUrlOrigin, totalSteps, buttonText, formCSSClasses, submitLoadingCSSClass);
            const result = await generateStep.generate();
            step = result.step;
            running = !result.finished;
        } catch (err) {
            if (err) console.error(err);
            running = false;
            return false;
        }
    }

    //  Returns true back to FormInitSteps to indicate successful completion
    
    return true;
}