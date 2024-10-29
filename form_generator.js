import InitSteps from "/includes/initSteps.js";

const initStepsInputData = {
    dataReqUrl: `/data/form_structure_data.json`,
    formName: `form-output`,
    formNodeSelector: `[data-name="form-output"]`,
    submitUrlOrigin: `https://jsonplaceholder.typicode.com/posts`,
    buttonText: `Submit`,
    formCSSClasses: `form-styling`,
    submitLoadingCSSClass: `loading`
}

InitSteps(initStepsInputData).then(result => {
    const formNode = document.querySelector(initStepsInputData.formNodeSelector);
    if (!result) {
        formNode.outerHTML = `<h1 class="err-msg">An error occured. Check browser console log for more details.</h1>`;
        return;
    }
    formNode.outerHTML = `<h1>Finished!</h1>`;
});