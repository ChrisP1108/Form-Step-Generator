import FormInitSteps from "/includes/formInitSteps.js";

// Initializes form creation.

FormInitSteps().then(result => {
    const formNode = document.querySelector(initStepsInputData.formNodeSelector);
    if (!result) {
        formNode.outerHTML = `<h1 class="err-msg">An error occured. Check browser console log for more details.</h1>`;
        return;
    }
    formNode.outerHTML = `<h1>Finished!</h1>`;
});