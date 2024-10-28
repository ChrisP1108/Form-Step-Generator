export default class FormHandler {

    // Properties

    #formNode;
    #fieldNodes = [];
    #formData = {};
    #customFunctionsSubscribers = [];
    #onChangeSubscribers = [];
    #onSubmitFinishSubscribers = [];
    #onSubmitInitSubscribers = [];
    #submitUrl;
    #submissionResponse;
    #timeoutDelay;
    #submitContentType = 'application/json';
    #clearFieldsOnSuccess = true;
    #removeFormFieldsOnSuccess = false;
    #responseSuccessMsg;
    #customHeaders = {};
    #listenersMap = new Map(); // Store references to event listeners

    constructor(formNode = null, submitUrl = null, responseSuccessMsg, timeOutDelay, customFunctionSubscriber = null) {
        this.#formNode = formNode ? document.querySelector(formNode) : null;
        this.#submitUrl = submitUrl;
        this.#responseSuccessMsg = typeof responseSuccessMsg === 'string' ? responseSuccessMsg : null;
        this.#timeoutDelay = timeOutDelay && Number(timeOutDelay) ? Number(timeOutDelay) : 8000;

        if (typeof customFunctionSubscriber === 'function') {
            this.#customFunctionsSubscribers.push(customFunctionSubscriber);
        } else if (customFunctionSubscriber !== null){
            console.error("customFunctionSubscriber parameter needs to be a function.");
        }

        if (this.#formNode) {
            this.#selectAllFormInputNodes();
        } else console.error("Form node must be provided as first parameter in FormHandler class.");
    }

    #selectAllFormInputNodes() {
        this.#fieldNodes = [
            ...this.#formNode.querySelectorAll(`input:not([type="submit"])`),
            ...this.#formNode.querySelectorAll("select"),
            ...this.#formNode.querySelectorAll("textarea")
        ];
        this.#customFunctionsSubscribers.forEach(subscriber => subscriber([...this.#fieldNodes, this.#formNode.querySelector(`[type="submit"]`)]));
        this.#setEventListeners();
    }

    clearFields() {
        this.#fieldNodes.forEach(node => {
            if (node.type === 'radio' || node.type === 'checkbox') {
                node.checked = false;
            } else if (node.type !== 'submit'){
                node.value = '';
            }
        });
        this.#formData = {};
    }

    removeFormFields() {
        if (this.#formNode) {
            this.#formNode.querySelectorAll("*:not(.form-submission-success)").forEach(node => node.remove());
        }
    }

    #setEventListeners() {
        this.#fieldNodes.forEach(node => {
            const listenerType = this.#getListenerType(node);
            this.#updateFormData(node);

            if (listenerType) {
                const listener = () => this.#updateFormData(node);
                node.addEventListener(listenerType, listener);

                // Store the event listener in the Map
                this.#listenersMap.set(node, { listenerType, listener });
            }
        });
        const formSubmitListener = async (e) => {
            e.preventDefault();
            this.#onSubmitInitSubscribers.forEach(subscriber => subscriber(this.#formData));
            if (this.validateFormData()) {
                const formSubmit = await this.#submitForm();
                this.#handleFormSubmitResponse(formSubmit);
            } else {
                console.error("Form validation failed.");
            }
        };
        this.#formNode.addEventListener("submit", formSubmitListener);
        this.#listenersMap.set(this.#formNode, { listenerType: 'submit', listener: formSubmitListener });
    }

    #getListenerType(node) {
        switch (node.nodeName) {
            case 'INPUT':
                return node.type === 'radio' || node.type === 'checkbox' ? 'change' : 'input';
            case 'SELECT':
                return 'change';
            case 'TEXTAREA':
                return 'input';
            default:
                return null;
        }
    }

    removeAllListeners() {
        this.#listenersMap.forEach(({ listenerType, listener }, node) => {
            node.removeEventListener(listenerType, listener);
        });
        this.#listenersMap.clear();
    }

    #updateFormData(node) {
        if (node.type === 'radio') {
            if (node.checked) {
                this.#formData[node.name] = node.value;
            } else this.#formData[node.name] = '';
        } else if (node.type === 'checkbox') {
            const multipleChoiceCheckboxes = this.#fieldNodes.filter(n => n.name === node.name);
            if (multipleChoiceCheckboxes.length > 1) {
                if (this.#formData[node.name]) {
                    if (this.#formData[node.name].includes(node.value) && !node.checked) {
                        this.#formData[node.name] = this.#formData[node.name].filter(selection => selection !== node.value);
                        this.#formData[node.name].sort();
                    } else if (node.checked) {
                        this.#formData[node.name].push(node.value);
                        this.#formData[node.name].sort();
                    }
                } else if (node.checked) {
                    this.#formData[node.name] = [node.value];
                } else this.#formData[node.name] = [];
            } else {
                if (node.checked) {
                    this.#formData[node.name] = node.value;
                } else this.#formData[node.name] = '';
            }
        } else this.#formData[node.name] = node.value;
        this.#onChangeSubscribers.forEach(subscriber => subscriber(this.#formData));
    }

    validateFormData() {
        // Add form validation logic here
        // Return true if valid, false otherwise
        return true;
    }

    #handleFormSubmitResponse(formSubmit) {
        const outputMsgNode = document.createElement("p");
        outputMsgNode.setAttribute("role", "alert");
        outputMsgNode.setAttribute("aria-live", "assertive");
        outputMsgNode.classList.add("form-submission-result-msg");
        if (!formSubmit.ok) {
            outputMsgNode.classList.add("form-submission-err-msg");
        } else {
            outputMsgNode.classList.add("form-submission-success");
        }
        outputMsgNode.innerText = formSubmit.outputMsg;
        if (this.#responseSuccessMsg) {
            const existingMsgNode = this.#formNode.querySelector("p.form-submission-result-msg");
            if (existingMsgNode) existingMsgNode.remove();
            this.#formNode.appendChild(outputMsgNode);
            this.onChange(() => {
                const resultMsgNode = this.#formNode.querySelector("p.form-submission-result-msg");
                if (resultMsgNode) resultMsgNode.remove();
            });
        }
        this.#submissionResponse = formSubmit;
        this.#onSubmitFinishSubscribers.forEach(subscriber => subscriber({ response: this.#submissionResponse, formData: this.#formData }));
        if (this.#clearFieldsOnSuccess) this.clearFields();
        if (this.#removeFormFieldsOnSuccess) this.removeFormFields();
    }

    get data() {
        return this.#formData;
    }

    get JSON() {
        return JSON.stringify(this.#formData);
    }

    get submitUrl() {
        return this.#submitUrl;
    }

    get formNode() {
        return this.#formNode;
    }

    get fieldNodes() {
        return this.#fieldNodes;
    }

    get submissionResponse() {
        return this.#submissionResponse;
    }

    set submitUrl(url) {
        if (typeof url === 'string') {
            this.#submitUrl = url;
        } else {
            console.error("submitUrl must be a string");
        }
    }

    set contentType(type) {
        this.#submitContentType = type;
    }

    set responseSuccessMsg(input) {
        if (typeof input === 'string') {
            this.#responseSuccessMsg = input;
        }
    }

    set formNode(formNode) {
        this.#formNode = formNode ? document.querySelector(formNode) : null;
        if (this.#formNode) {
            this.#selectAllFormInputNodes();
        } else {
            console.error("formNode input value returned null.");
        }
    }

    set clearFieldsOnSuccess(value) {
        if (typeof value === 'boolean') {
            this.#clearFieldsOnSuccess = value;
        }
    }

    set removeFormFieldsOnSuccess(value) {
        if (typeof value === 'boolean') {
            this.#removeFormFieldsOnSuccess = value;
        }
    }

    set customHeaders(headers) {
        if (typeof headers === 'object' && !Array.isArray(headers)) {
            this.#customHeaders = headers;
        } else {
            console.error("customHeaders must be an object");
        }
    }

    customFunction(callback ) {
        if (typeof callback === 'function') {
            this.#customFunctionsSubscribers.push(callback);
        } else {
            console.error("customFunction parameter needs to be a function.");
        }
    }

    onChange(callback) {
        if (typeof callback === 'function') {
            this.#onChangeSubscribers.push(callback);
        } else {
            console.error("onChange parameter needs to be a function.");
        }
    }

    onSubmitInit(callback) {
        if (typeof callback === 'function') {
            this.#onSubmitInitSubscribers.push(callback);
        } else {
            console.error("onSubmitInit parameter needs to be a function.");
        }
    }

    onSubmitFinish(callback) {
        if (typeof callback === 'function') {
            this.#onSubmitFinishSubscribers.push(callback);
        } else {
            console.error("onSubmitFinish parameter needs to be a function.");
        }
    }

    async #submitForm() {
        if (!this.#submitUrl) {
            const noSubmitUrlMsg = "A URL to send the form to via an HTTP POST request must be set using the submitUrl set property.";
            console.error(noSubmitUrlMsg);
            return { ok: false, status: null, msg: noSubmitUrlMsg, outputMsg: noSubmitUrlMsg };
        }
    
        const outputErrMsg = "There was an error submitting the form data.";
    
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => {
                resolve({ ok: false, status: null, msg: "Timed out.", outputMsg: "Took too long to get a response from the server. Please try again." });
            }, this.#timeoutDelay);
        });
    
        const fetchPromise = fetch(this.#submitUrl, {
            method: 'POST',
            headers: {
                'Content-Type': this.#submitContentType,
                ...this.#customHeaders
            },
            body: this.JSON
        }).then(async (res) => {
            if (res.ok) {
                return { ok: res.ok, status: res.status, data: await res.json(), msg: "Success", outputMsg: this.#responseSuccessMsg };
            } else {
                console.error(`Server responded with a ${res.status} status code`);
                return { ok: false, status: res.status, msg: `Server responded with a ${res.status} status code`, outputMsg: outputErrMsg };
            }
        }).catch((err) => {
            console.error(err);
            return { ok: false, status: null, msg: err.toString(), outputMsg: outputErrMsg };
        });
    
        return Promise.race([timeoutPromise, fetchPromise]);
    }
}