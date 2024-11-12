import { state } from "/formState.js";

export default class StateStore {

    // Enter State Variables Inside #state property

    static #state = state;

    static #subscribers = Object.keys(StateStore.#state).reduce((curr, acc) => ({...curr, [acc]: []}), {});

    static #stateKeyError(key) {
        console.error(`State of "${key}" does not exist.`);
    }

    static get(key) {
        if (!StateStore.#state.hasOwnProperty(key)) {
            StateStore.#stateKeyError(key);
            return undefined;
        }
        return StateStore.#state[key];
    }

    static getAll() {
        return StateStore.#state;
    }

    static set(key, value) {
        if (!StateStore.#state.hasOwnProperty(key)) {
            StateStore.#stateKeyError(key);
            return;
        }
        StateStore.#state[key] = value;
        StateStore.#subscribers[key].forEach(subscriber => {
            subscriber(value);
        });
    }

    static subscribe(key, callback) {
        if (!StateStore.#subscribers[key]) {
            StateStore.#stateKeyError(key);
            return;
        }
        if (typeof callback !== 'function') {
            console.error(`Subscriber for key "${key}" must be a function.`);
            return;
        }
        StateStore.#subscribers[key].push(callback);
    }

    static unsubscribe(key, callback) {
        if (!StateStore.#subscribers[key]) {
            StateStore.#stateKeyError(key);
            return;
        }
        StateStore.#subscribers[key] = StateStore.#subscribers[key].filter(cb => cb !== callback);
    }

    static clearSubscribers(key) {
        if (!StateStore.#subscribers[key]) {
            StateStore.#stateKeyError(key);
            return;
        }
        StateStore.#subscribers[key] = [];
    }
}