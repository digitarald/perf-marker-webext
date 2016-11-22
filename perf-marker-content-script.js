'use strict';

function mark(label, timeStamp, payload = {}) {
    payload.url = document.URL;
    if (timeStamp) {
        const lowRes = Date.now();
        const highRes = performance.now();
        // TODO page load events give broken high performance timestamps
        if (timeStamp > lowRes) {
            timeStamp /= 1000;
        } else if (timeStamp < lowRes - highRes && timeStamp > highRes) {
            timeStamp = lowRes;
        }
        payload.timeDelay = ((timeStamp <= highRes)
            ? highRes
            : lowRes) - timeStamp;
    }
    performance.mark(`${label}: ${JSON.stringify(payload)}`);
}

const timings = performance.timing;
mark('domLoading', timings.domLoading);

const passiveOpts = {
    passive: true,
    capture: true
};
const onceOptions = Object.assign({
    once: true
}, passiveOpts);

document.addEventListener('readystatechange', (event) => {
    if (document.readyState === 'interactive') {
        mark('domInteractive', timings.domInteractive);
    } else if (document.readyState === 'complete') {
        mark('domComplete', timings.domComplete);
    }
}, passiveOpts);

document.addEventListener('DOMContentLoaded', (event) => {
    mark('domContentLoaded', timings.domContentLoadedEventStart);
}, onceOptions);

window.addEventListener('load', (event) => {
    mark('load', timings.loadEventStart, {timings: timings.toJSON()});
});

window.addEventListener('pageshow', (event) => {
    mark('pageShow', event.timeStamp, {persisted: event.persisted});
}, passiveOpts);

window.addEventListener('pagehide', (event) => {
    mark('pageHide', event.timeStamp, {persisted: event.persisted});
}, passiveOpts);

let scrollPoll = 0;
let scrollDistance = 0;
let scrollLastTop = 0;
let scrollLastTime = 0;
const updateScrollDistance = () => {};
const scrollEnd = () => {
    scrollPoll = 0;
    mark('inputScrollEnd', scrollLastTime, {distance: scrollDistance});
    scrollDistance = 0;
};

document.addEventListener('scroll', (event) => {
    scrollLastTime = event.timeStamp || performance.now();
    if (scrollPoll === 0) {
        mark('inputScroll', scrollLastTime);
    } else {
        clearTimeout(scrollPoll);
    }
    let top = event.pageY;
    scrollDistance += Math.abs(scrollLastTop - top);
    scrollLastTop = top;
    // 50ms should cover for slower firing passive listener
    scrollPoll = setTimeout(scrollEnd, 50);
}, passiveOpts);

window.addEventListener('mousemove', (event) => {
    mark('inputFirstMove', event.timeStamp);
}, onceOptions);

document.addEventListener('click', (event) => {
    mark('inputClick', event.timeStamp);
}, passiveOpts);

document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (/^(control|shift|meta)$/i.test(key)) {
        return;
    }
    mark('inputKey', event.timeStamp, {key: key});
}, passiveOpts);

window.addEventListener('beforeunload', (event) => {
    mark('domUnload', event.timeStamp);
}, onceOptions);
