//#region node_modules/automation-events/build/es2019/functions/create-extended-exponential-ramp-to-value-automation-event.js
var createExtendedExponentialRampToValueAutomationEvent = (value, endTime, insertTime) => {
	return {
		endTime,
		insertTime,
		type: "exponentialRampToValue",
		value
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-extended-linear-ramp-to-value-automation-event.js
var createExtendedLinearRampToValueAutomationEvent = (value, endTime, insertTime) => {
	return {
		endTime,
		insertTime,
		type: "linearRampToValue",
		value
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-set-value-automation-event.js
var createSetValueAutomationEvent = (value, startTime) => {
	return {
		startTime,
		type: "setValue",
		value
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-set-value-curve-automation-event.js
var createSetValueCurveAutomationEvent = (values, startTime, duration) => {
	return {
		duration,
		startTime,
		type: "setValueCurve",
		values
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/get-target-value-at-time.js
var getTargetValueAtTime = (time, valueAtStartTime, { startTime, target, timeConstant }) => {
	return target + (valueAtStartTime - target) * Math.exp((startTime - time) / timeConstant);
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/exponential-ramp-to-value-automation-event.js
var isExponentialRampToValueAutomationEvent = (automationEvent) => {
	return automationEvent.type === "exponentialRampToValue";
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/linear-ramp-to-value-automation-event.js
var isLinearRampToValueAutomationEvent = (automationEvent) => {
	return automationEvent.type === "linearRampToValue";
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/any-ramp-to-value-automation-event.js
var isAnyRampToValueAutomationEvent = (automationEvent) => {
	return isExponentialRampToValueAutomationEvent(automationEvent) || isLinearRampToValueAutomationEvent(automationEvent);
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/set-value-automation-event.js
var isSetValueAutomationEvent = (automationEvent) => {
	return automationEvent.type === "setValue";
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/set-value-curve-automation-event.js
var isSetValueCurveAutomationEvent = (automationEvent) => {
	return automationEvent.type === "setValueCurve";
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/get-value-of-automation-event-at-index-at-time.js
var getValueOfAutomationEventAtIndexAtTime = (automationEvents, index, time, defaultValue) => {
	const automationEvent = automationEvents[index];
	return automationEvent === void 0 ? defaultValue : isAnyRampToValueAutomationEvent(automationEvent) || isSetValueAutomationEvent(automationEvent) ? automationEvent.value : isSetValueCurveAutomationEvent(automationEvent) ? automationEvent.values[automationEvent.values.length - 1] : getTargetValueAtTime(time, getValueOfAutomationEventAtIndexAtTime(automationEvents, index - 1, automationEvent.startTime, defaultValue), automationEvent);
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/get-end-time-and-value-of-previous-automation-event.js
var getEndTimeAndValueOfPreviousAutomationEvent = (automationEvents, index, currentAutomationEvent, nextAutomationEvent, defaultValue) => {
	return currentAutomationEvent === void 0 ? [nextAutomationEvent.insertTime, defaultValue] : isAnyRampToValueAutomationEvent(currentAutomationEvent) ? [currentAutomationEvent.endTime, currentAutomationEvent.value] : isSetValueAutomationEvent(currentAutomationEvent) ? [currentAutomationEvent.startTime, currentAutomationEvent.value] : isSetValueCurveAutomationEvent(currentAutomationEvent) ? [currentAutomationEvent.startTime + currentAutomationEvent.duration, currentAutomationEvent.values[currentAutomationEvent.values.length - 1]] : [currentAutomationEvent.startTime, getValueOfAutomationEventAtIndexAtTime(automationEvents, index - 1, currentAutomationEvent.startTime, defaultValue)];
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/cancel-and-hold-automation-event.js
var isCancelAndHoldAutomationEvent = (automationEvent) => {
	return automationEvent.type === "cancelAndHold";
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/cancel-scheduled-values-automation-event.js
var isCancelScheduledValuesAutomationEvent = (automationEvent) => {
	return automationEvent.type === "cancelScheduledValues";
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/get-event-time.js
var getEventTime = (automationEvent) => {
	if (isCancelAndHoldAutomationEvent(automationEvent) || isCancelScheduledValuesAutomationEvent(automationEvent)) return automationEvent.cancelTime;
	if (isExponentialRampToValueAutomationEvent(automationEvent) || isLinearRampToValueAutomationEvent(automationEvent)) return automationEvent.endTime;
	return automationEvent.startTime;
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/get-exponential-ramp-value-at-time.js
var getExponentialRampValueAtTime = (time, startTime, valueAtStartTime, { endTime, value }) => {
	if (valueAtStartTime === value) return value;
	if (0 < valueAtStartTime && 0 < value || valueAtStartTime < 0 && value < 0) return valueAtStartTime * (value / valueAtStartTime) ** ((time - startTime) / (endTime - startTime));
	return time < endTime ? valueAtStartTime : value;
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/get-linear-ramp-value-at-time.js
var getLinearRampValueAtTime = (time, startTime, valueAtStartTime, { endTime, value }) => {
	return valueAtStartTime + (time - startTime) / (endTime - startTime) * (value - valueAtStartTime);
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/interpolate-value.js
var interpolateValue = (values, theoreticIndex) => {
	const lowerIndex = Math.floor(theoreticIndex);
	if (lowerIndex === theoreticIndex) return values[lowerIndex];
	const upperIndex = Math.ceil(theoreticIndex);
	return (1 - (theoreticIndex - lowerIndex)) * values[lowerIndex] + (1 - (upperIndex - theoreticIndex)) * values[upperIndex];
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/get-value-curve-value-at-time.js
var getValueCurveValueAtTime = (time, { duration, startTime, values }) => {
	return interpolateValue(values, (time - startTime) / duration * (values.length - 1));
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/truncate-value-curve.js
var truncateValueCurve = (values, originalDuration, targetDuration) => {
	const length = values.length;
	const truncatedLength = Math.max(1, Math.floor(targetDuration / originalDuration * length)) + 1;
	const truncatedValues = values instanceof Float32Array ? new Float32Array(truncatedLength) : values.slice(0, truncatedLength);
	for (let i = 0; i < truncatedLength; i += 1) {
		const theoreticIndex = i / (truncatedLength - 1) * targetDuration / originalDuration * (length - 1);
		truncatedValues[i] = interpolateValue(values, theoreticIndex);
	}
	return truncatedValues;
};
//#endregion
//#region node_modules/automation-events/build/es2019/guards/set-target-automation-event.js
var isSetTargetAutomationEvent = (automationEvent) => {
	return automationEvent.type === "setTarget";
};
//#endregion
//#region node_modules/automation-events/build/es2019/classes/automation-event-list.js
var AutomationEventList = class {
	constructor(defaultValue) {
		this._automationEvents = [];
		this._currenTime = 0;
		this._defaultValue = defaultValue;
	}
	[Symbol.iterator]() {
		return this._automationEvents[Symbol.iterator]();
	}
	add(automationEvent) {
		const eventTime = getEventTime(automationEvent);
		if (isCancelAndHoldAutomationEvent(automationEvent) || isCancelScheduledValuesAutomationEvent(automationEvent)) {
			const index = this._automationEvents.findIndex((currentAutomationEvent) => {
				if (isCancelScheduledValuesAutomationEvent(automationEvent) && isSetValueCurveAutomationEvent(currentAutomationEvent)) return currentAutomationEvent.startTime + currentAutomationEvent.duration >= eventTime;
				return getEventTime(currentAutomationEvent) >= eventTime;
			});
			const removedAutomationEvent = this._automationEvents[index];
			if (index !== -1) this._automationEvents = this._automationEvents.slice(0, index);
			if (isCancelAndHoldAutomationEvent(automationEvent)) {
				const lastAutomationEvent = this._automationEvents[this._automationEvents.length - 1];
				if (removedAutomationEvent !== void 0 && isAnyRampToValueAutomationEvent(removedAutomationEvent)) {
					if (lastAutomationEvent !== void 0 && isSetTargetAutomationEvent(lastAutomationEvent)) throw new Error("The internal list is malformed.");
					const startTime = lastAutomationEvent === void 0 ? removedAutomationEvent.insertTime : isSetValueCurveAutomationEvent(lastAutomationEvent) ? lastAutomationEvent.startTime + lastAutomationEvent.duration : getEventTime(lastAutomationEvent);
					const startValue = lastAutomationEvent === void 0 ? this._defaultValue : isSetValueCurveAutomationEvent(lastAutomationEvent) ? lastAutomationEvent.values[lastAutomationEvent.values.length - 1] : lastAutomationEvent.value;
					const value = isExponentialRampToValueAutomationEvent(removedAutomationEvent) ? getExponentialRampValueAtTime(eventTime, startTime, startValue, removedAutomationEvent) : getLinearRampValueAtTime(eventTime, startTime, startValue, removedAutomationEvent);
					const truncatedAutomationEvent = isExponentialRampToValueAutomationEvent(removedAutomationEvent) ? createExtendedExponentialRampToValueAutomationEvent(value, eventTime, this._currenTime) : createExtendedLinearRampToValueAutomationEvent(value, eventTime, this._currenTime);
					this._automationEvents.push(truncatedAutomationEvent);
				}
				if (lastAutomationEvent !== void 0 && isSetTargetAutomationEvent(lastAutomationEvent)) this._automationEvents.push(createSetValueAutomationEvent(this.getValue(eventTime), eventTime));
				if (lastAutomationEvent !== void 0 && isSetValueCurveAutomationEvent(lastAutomationEvent) && lastAutomationEvent.startTime + lastAutomationEvent.duration > eventTime) {
					const duration = eventTime - lastAutomationEvent.startTime;
					this._automationEvents[this._automationEvents.length - 1] = createSetValueCurveAutomationEvent(truncateValueCurve(lastAutomationEvent.values, lastAutomationEvent.duration, duration), lastAutomationEvent.startTime, duration);
				}
			}
		} else {
			const index = this._automationEvents.findIndex((currentAutomationEvent) => getEventTime(currentAutomationEvent) > eventTime);
			const previousAutomationEvent = index === -1 ? this._automationEvents[this._automationEvents.length - 1] : this._automationEvents[index - 1];
			if (previousAutomationEvent !== void 0 && isSetValueCurveAutomationEvent(previousAutomationEvent) && getEventTime(previousAutomationEvent) + previousAutomationEvent.duration > eventTime) return false;
			const persistentAutomationEvent = isExponentialRampToValueAutomationEvent(automationEvent) ? createExtendedExponentialRampToValueAutomationEvent(automationEvent.value, automationEvent.endTime, this._currenTime) : isLinearRampToValueAutomationEvent(automationEvent) ? createExtendedLinearRampToValueAutomationEvent(automationEvent.value, eventTime, this._currenTime) : automationEvent;
			if (index === -1) this._automationEvents.push(persistentAutomationEvent);
			else {
				if (isSetValueCurveAutomationEvent(automationEvent) && eventTime + automationEvent.duration > getEventTime(this._automationEvents[index])) return false;
				this._automationEvents.splice(index, 0, persistentAutomationEvent);
			}
		}
		return true;
	}
	flush(time) {
		const index = this._automationEvents.findIndex((currentAutomationEvent) => getEventTime(currentAutomationEvent) > time);
		if (index > 1) {
			const remainingAutomationEvents = this._automationEvents.slice(index - 1);
			const firstRemainingAutomationEvent = remainingAutomationEvents[0];
			if (isSetTargetAutomationEvent(firstRemainingAutomationEvent)) remainingAutomationEvents.unshift(createSetValueAutomationEvent(getValueOfAutomationEventAtIndexAtTime(this._automationEvents, index - 2, firstRemainingAutomationEvent.startTime, this._defaultValue), firstRemainingAutomationEvent.startTime));
			this._automationEvents = remainingAutomationEvents;
		}
	}
	getValue(time) {
		if (this._automationEvents.length === 0) return this._defaultValue;
		const indexOfNextEvent = this._automationEvents.findIndex((automationEvent) => getEventTime(automationEvent) > time);
		const nextAutomationEvent = this._automationEvents[indexOfNextEvent];
		const indexOfCurrentEvent = (indexOfNextEvent === -1 ? this._automationEvents.length : indexOfNextEvent) - 1;
		const currentAutomationEvent = this._automationEvents[indexOfCurrentEvent];
		if (currentAutomationEvent !== void 0 && isSetTargetAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent) || nextAutomationEvent.insertTime > time)) return getTargetValueAtTime(time, getValueOfAutomationEventAtIndexAtTime(this._automationEvents, indexOfCurrentEvent - 1, currentAutomationEvent.startTime, this._defaultValue), currentAutomationEvent);
		if (currentAutomationEvent !== void 0 && isSetValueAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent))) return currentAutomationEvent.value;
		if (currentAutomationEvent !== void 0 && isSetValueCurveAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent) || currentAutomationEvent.startTime + currentAutomationEvent.duration > time)) {
			if (time < currentAutomationEvent.startTime + currentAutomationEvent.duration) return getValueCurveValueAtTime(time, currentAutomationEvent);
			return currentAutomationEvent.values[currentAutomationEvent.values.length - 1];
		}
		if (currentAutomationEvent !== void 0 && isAnyRampToValueAutomationEvent(currentAutomationEvent) && (nextAutomationEvent === void 0 || !isAnyRampToValueAutomationEvent(nextAutomationEvent))) return currentAutomationEvent.value;
		if (nextAutomationEvent !== void 0 && isExponentialRampToValueAutomationEvent(nextAutomationEvent)) {
			const [startTime, value] = getEndTimeAndValueOfPreviousAutomationEvent(this._automationEvents, indexOfCurrentEvent, currentAutomationEvent, nextAutomationEvent, this._defaultValue);
			return getExponentialRampValueAtTime(time, startTime, value, nextAutomationEvent);
		}
		if (nextAutomationEvent !== void 0 && isLinearRampToValueAutomationEvent(nextAutomationEvent)) {
			const [startTime, value] = getEndTimeAndValueOfPreviousAutomationEvent(this._automationEvents, indexOfCurrentEvent, currentAutomationEvent, nextAutomationEvent, this._defaultValue);
			return getLinearRampValueAtTime(time, startTime, value, nextAutomationEvent);
		}
		return this._defaultValue;
	}
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-cancel-and-hold-automation-event.js
var createCancelAndHoldAutomationEvent = (cancelTime) => {
	return {
		cancelTime,
		type: "cancelAndHold"
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-cancel-scheduled-values-automation-event.js
var createCancelScheduledValuesAutomationEvent = (cancelTime) => {
	return {
		cancelTime,
		type: "cancelScheduledValues"
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-exponential-ramp-to-value-automation-event.js
var createExponentialRampToValueAutomationEvent = (value, endTime) => {
	return {
		endTime,
		type: "exponentialRampToValue",
		value
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-linear-ramp-to-value-automation-event.js
var createLinearRampToValueAutomationEvent = (value, endTime) => {
	return {
		endTime,
		type: "linearRampToValue",
		value
	};
};
//#endregion
//#region node_modules/automation-events/build/es2019/functions/create-set-target-automation-event.js
var createSetTargetAutomationEvent = (target, startTime, timeConstant) => {
	return {
		startTime,
		target,
		timeConstant,
		type: "setTarget"
	};
};
//#endregion
export { createCancelAndHoldAutomationEvent as a, createSetValueAutomationEvent as c, createCancelScheduledValuesAutomationEvent as i, createLinearRampToValueAutomationEvent as n, AutomationEventList as o, createExponentialRampToValueAutomationEvent as r, createSetValueCurveAutomationEvent as s, createSetTargetAutomationEvent as t };
