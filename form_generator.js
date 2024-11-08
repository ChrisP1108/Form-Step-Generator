import FormInitSteps from "/includes/formInitSteps.js";

// Defines where to get starting data from, the name of the form, what HTML node to render form to, url to submit form data, and CSS class names

const initStepsInputData = {
    dataReqUrl: `/data/form_structure_data.json`,
    formName: `form-output`,
    formNodeSelector: `[data-name="form-output"]`,
    submitUrlOrigin: `https://jsonplaceholder.typicode.com/posts`,
    buttonText: `Submit`,
    formCSSClasses: `form-styling`,
    submitLoadingCSSClass: `loading`
}

// Initializes form creation.

FormInitSteps(initStepsInputData).then(result => {
    const formNode = document.querySelector(initStepsInputData.formNodeSelector);
    if (!result) {
        formNode.outerHTML = `<h1 class="err-msg">An error occured. Check browser console log for more details.</h1>`;
        return;
    }
    formNode.outerHTML = `<h1>Finished!</h1>`;
});