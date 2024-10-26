export default function HttpGet(url, timeoutDelay = 8000) {
    const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(`Timed out. Took too long to get a response from the server.`)
        }, timeoutDelay);
    });
    const fetchPromise = fetch(url).then(async (res) => {    
        if (res.ok) {
            return { ok: res.ok, status: res.status, data: await res.json(), msg: "Success" };
        } else {
            console.error(`Server responded with a ${res.status} status code`);
            const notOkData = { ok: false, status: res.status, msg: `Server responded with a ${res.status} status code` };
            try {
                const dataResponse = await res.json();
                notOkData.data = dataResponse;
                return notOkData;
            } catch(err) {
                console.error(err);
                return notOkData;
            }
        }
    }).catch((err) => {
        console.error(err);
        return { ok: false, status: null, msg: err.toString()  };
    });

    return Promise.race([timeoutPromise, fetchPromise]);
}