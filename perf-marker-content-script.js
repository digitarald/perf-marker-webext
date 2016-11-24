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

window.addEventListener('abort', (event) => {
    mark('abort', event.timeStamp);
}, false);

document.addEventListener('visibilitychange', (event) => {
    mark('visibilityChange', event.timeStamp, {state: document.visibilityState});
}, false);

let scrollPoll = 0;
let scrollStart = 0;
let scrollEnd = 0;
let scrollLastTime = 0;
const updateScrollDistance = () => {};
const scrollDidEnd = () => {
    scrollPoll = 0;
    mark('inputScrollEnd', scrollLastTime, {top: scrollEnd});
    scrollStart = scrollEnd;
};

document.addEventListener('scroll', (event) => {
    scrollLastTime = event.timeStamp || performance.now();
    if (scrollPoll === 0) {
        mark('inputScroll', scrollLastTime, {top: scrollStart});
    } else {
        clearTimeout(scrollPoll);
    }
    scrollEnd = event.pageY;
    // 50ms should cover for slower firing passive listener
    scrollPoll = setTimeout(scrollDidEnd, 50);
}, passiveOpts);

window.addEventListener('mousemove', (event) => {
    mark('inputFirstMove', event.timeStamp);
}, onceOptions);

document.addEventListener('click', (event) => {
    mark('inputClick', event.timeStamp);
}, passiveOpts);

document.addEventListener('keydown', (event) => {
    const key = event.key;
    if (['Control', 'Shift', 'Meta'].includes(key)) {
        return;
    }
    mark('inputKey', event.timeStamp, {key: key});
}, passiveOpts);

window.addEventListener('beforeunload', (event) => {
    mark('domUnload', event.timeStamp);
}, onceOptions);
