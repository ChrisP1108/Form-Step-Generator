import HttpGet from "/helpers/httpReq.js";
import FormStepGenerator from "/includes/formStepGenerator.js";
import StateStore from "/includes/stateStore.js";

export default async function FormInitSteps() {

    // Gets starting data 

    try {
        const res = await HttpGet(StateStore.get("dataReqUrl"), 8000);
        if (!res.ok) {
            console.error(`Response returned a ${res.status} status code`);
            return false;
        }
        StateStore.set("apiData",res.data);
        StateStore.set("totalSteps", [...StateStore.get("apiData")].sort((acc, curr) => acc.step > curr.step ? -1 : 1)[0].step);
    } catch (err) {
        console.error(err);
        return false;
    }

    // Runs FormStepGenerator in continuous loop for generating form steps until FormStepGenerator returns a finished key with a value of true
    
    while(StateStore.get("running")) {  
        try {
            await FormStepGenerator.generate();
        } catch (err) {
            if (err) console.error(err);
            StateStore.set("running", false);
            return false;
        }
    }

    //  Returns true back to FormInitSteps to indicate successful completion
    
    return true;
}