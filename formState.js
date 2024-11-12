// Set variables for state store

export const state = {
    dataReqUrl: `/data/form_structure_data.json`,
    formName: `form-output`,
    formNodeSelector: `[data-name="form-output"]`,
    submitUrlOrigin: `https://jsonplaceholder.typicode.com/posts`,
    buttonText: `Submit`,
    formCSSClasses: `form-styling`,
    submitLoadingCSSClass: `loading`,
    apiData: null,
    totalSteps: null,
    running: true,
    step: 1,
    stepFieldsData: [],
    addRequiredAttribute: false
};